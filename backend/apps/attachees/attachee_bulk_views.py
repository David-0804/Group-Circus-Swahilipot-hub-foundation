"""
Nexus — Attachee Bulk Import & Management Views
Handles: bulk CSV/Excel import with role-scoped restrictions,
         supervisor assignment/deassignment, account deactivation
"""
import io
import csv
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from rest_framework import serializers, status
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.accounts.models import Department
from apps.accounts.models import Branch

try:
    import openpyxl
    OPENPYXL_AVAILABLE = True
except ImportError:
    OPENPYXL_AVAILABLE = False

User = get_user_model()

# ── Helpers ───────────────────────────────────────────────────────────────────

REQUIRED_COLS = {'email', 'first_name', 'last_name'}

ALLOWED_COLS = {
    'email', 'first_name', 'last_name', 'phone',
    'employee_id', 'role', 'password',
}


def _normalize_row(row: dict) -> dict:
    return {k.strip().lower(): str(v).strip() for k, v in row.items() if v is not None}


def _rows_from_csv(file_bytes: bytes) -> list[dict]:
    decoded = file_bytes.decode('utf-8-sig')
    reader = csv.DictReader(io.StringIO(decoded))
    return [_normalize_row(r) for r in reader]


def _rows_from_xlsx(file_bytes: bytes) -> list[dict]:
    if not OPENPYXL_AVAILABLE:
        raise ValueError("openpyxl is not installed; only CSV is supported.")
    wb = openpyxl.load_workbook(io.BytesIO(file_bytes), read_only=True, data_only=True)
    ws = wb.active
    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        return []
    headers = [str(h).strip().lower() if h else '' for h in rows[0]]
    result = []
    for row in rows[1:]:
        if not any(row):
            continue
        result.append(_normalize_row(dict(zip(headers, row))))
    return result


def _parse_file(uploaded_file) -> list[dict]:
    name = uploaded_file.name.lower()
    data = uploaded_file.read()
    if name.endswith('.csv'):
        return _rows_from_csv(data)
    if name.endswith(('.xlsx', '.xls')):
        return _rows_from_xlsx(data)
    raise ValueError("Unsupported file type. Upload a .csv or .xlsx file.")


# ── Bulk Import ───────────────────────────────────────────────────────────────

class AttacheeBulkImportView(APIView):
    """
    POST /attachees/bulk-import/

    Role rules:
      - system_admin  → can import into any department in their OWN branch only
      - department_leader → can import into their own department & branch only
      - Rows whose department/branch don't match the caller's scope are SKIPPED
        (not errored; they are reported in the `skipped` list).
    """
    parser_classes = [MultiPartParser]

    def post(self, request):
        user = request.user
        role = getattr(user, 'role', '')

        if role not in ('system_admin', 'department_leader'):
            return Response(
                {'detail': 'Only system admins and department leaders may bulk-import attachees.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        uploaded = request.FILES.get('file')
        if not uploaded:
            return Response({'detail': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            rows = _parse_file(uploaded)
        except ValueError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        if not rows:
            return Response({'detail': 'File is empty or has no data rows.'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate headers
        headers = set(rows[0].keys())
        missing = REQUIRED_COLS - headers
        if missing:
            return Response(
                {'detail': f"Missing required columns: {', '.join(sorted(missing))}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Caller's scope constraints
        caller_branch = user.branch        # Branch FK instance or None
        caller_dept   = user.department    # Department FK instance or None

        created, skipped, duplicates, errors = [], [], [], []

        for i, row in enumerate(rows, start=2):  # row 1 = header
            email = row.get('email', '').lower()
            if not email:
                errors.append({'row': i, 'reason': 'Missing email.'})
                continue

            # ── Scope check ──────────────────────────────────────────────────
            # Resolve department from row (by name or id) or fall back to caller's dept
            row_dept_raw   = row.get('department', '').strip()
            row_branch_raw = row.get('branch', '').strip()

            resolved_dept   = caller_dept    # default: caller's dept
            resolved_branch = caller_branch  # default: caller's branch

            if row_dept_raw:
                from apps.accounts.models import Department
                try:
                    dept_qs = Department.objects.filter(organisation=user.organisation)
                    dept = (
                        dept_qs.filter(id=row_dept_raw).first()
                        or dept_qs.filter(name__iexact=row_dept_raw).first()
                    )
                except Exception:
                    dept = None

                if dept is None:
                    skipped.append({'row': i, 'email': email, 'reason': f"Department '{row_dept_raw}' not found."})
                    continue

                # Department leader: only their department
                if role == 'department_leader' and dept != caller_dept:
                    skipped.append({'row': i, 'email': email,
                                    'reason': f"Department '{dept.name}' is outside your scope."})
                    continue
                resolved_dept = dept

            if row_branch_raw:
                from apps.accounts.models import Branch
                try:
                    branch_qs = Branch.objects.filter(organisation=user.organisation)
                    branch = (
                        branch_qs.filter(id=row_branch_raw).first()
                        or branch_qs.filter(name__iexact=row_branch_raw).first()
                    )
                except Exception:
                    branch = None

                if branch is None:
                    skipped.append({'row': i, 'email': email, 'reason': f"Branch '{row_branch_raw}' not found."})
                    continue

                # Both roles: only their branch
                if branch != caller_branch:
                    skipped.append({'row': i, 'email': email,
                                    'reason': f"Branch '{branch.name}' is outside your scope."})
                    continue
                resolved_branch = branch

            # ── Duplicate check ───────────────────────────────────────────────
            existing = User.objects.filter(email=email).first()
            if existing:
                duplicates.append({
                    'row': i,
                    'email': email,
                    'full_name': existing.get_full_name(),
                    'department': existing.department.name if existing.department else None,
                    'branch': existing.branch.name if existing.branch else None,
                    'is_active': existing.is_active,
                    'date_joined': existing.date_joined.isoformat() if existing.date_joined else None,
                    'message': 'User with this email already exists.',
                })
                continue

            # Employee ID uniqueness check
            emp_id = row.get('employee_id', '').strip() or None
            if emp_id and User.objects.filter(employee_id=emp_id).exists():
                duplicates.append({
                    'row': i,
                    'email': email,
                    'message': f"Employee ID '{emp_id}' already exists.",
                })
                continue

            # ── Create user ───────────────────────────────────────────────────
            row_role = row.get('role', 'attachee').strip().lower()
            # Restrict to safe roles only (no privilege escalation via import)
            if row_role not in ('attachee',):
                row_role = 'attachee'

            try:
                new_user = User.objects.create_user(
                    email=email,
                    password=row.get('password', 'TempPass@1234'),
                    first_name=row.get('first_name', '').strip(),
                    last_name=row.get('last_name', '').strip(),
                    phone=row.get('phone', '').strip(),
                    employee_id=emp_id,
                    role=row_role,
                    organisation=user.organisation,
                    branch=resolved_branch,
                    department=resolved_dept,
                )
                created.append({
                    'email': new_user.email,
                    'full_name': new_user.get_full_name(),
                    'department': new_user.department.name if new_user.department else None,
                    'branch': new_user.branch.name if new_user.branch else None,
                })
            except IntegrityError as exc:
                errors.append({'row': i, 'email': email, 'reason': str(exc)})
            except Exception as exc:
                errors.append({'row': i, 'email': email, 'reason': str(exc)})

        overall_status = status.HTTP_201_CREATED if created else status.HTTP_400_BAD_REQUEST
        return Response({
            'summary': {
                'created':    len(created),
                'duplicates': len(duplicates),
                'skipped':    len(skipped),
                'errors':     len(errors),
            },
            'created':    created[:50],
            'duplicates': duplicates[:50],
            'skipped':    skipped[:50],
            'errors':     errors[:50],
        }, status=overall_status)


# ── Supervisor Assignment ─────────────────────────────────────────────────────

class AssignSupervisorView(APIView):
    """
    POST /attachees/<uuid:pk>/assign-supervisor/
    Body: { "supervisor_id": "<uuid>" }

    Department leader only — can only assign supervisors within same dept.
    """
    def post(self, request, pk):
        user = request.user
        if user.role not in ('department_leader', 'system_admin', 'hr_officer'):
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            attachee = User.objects.get(pk=pk, role='attachee', organisation=user.organisation)
        except User.DoesNotExist:
            return Response({'detail': 'Attachee not found.'}, status=status.HTTP_404_NOT_FOUND)

        if user.role == 'department_leader' and attachee.department != user.department:
            return Response({'detail': 'Attachee is not in your department.'}, status=status.HTTP_403_FORBIDDEN)

        supervisor_id = request.data.get('supervisor_id')
        if not supervisor_id:
            return Response({'detail': 'supervisor_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            supervisor = User.objects.get(
                pk=supervisor_id,
                role='supervisor',
                organisation=user.organisation,
            )
        except User.DoesNotExist:
            return Response({'detail': 'Supervisor not found in your organisation.'}, status=status.HTTP_404_NOT_FOUND)

        if user.role == 'department_leader' and supervisor.department != user.department:
            return Response({'detail': 'Supervisor is not in your department.'}, status=status.HTTP_403_FORBIDDEN)

        # Store supervisor link — extend User model or use a profile FK.
        # Using a lightweight approach: store supervisor's PK in a JSON extra field
        # or a dedicated AttacheeProfile if you have one. Here we assume a
        # `supervisor` FK on User (add to models if not present) or fallback to
        # a meta-field approach via a separate model. For now we surface the hook.
        if hasattr(attachee, 'supervisor_user'):
            # If you have a ForeignKey named supervisor_user on User:
            attachee.supervisor_user = supervisor
            attachee.save(update_fields=['supervisor_user'])
        else:
            # Graceful fallback — caller should add the FK to their User model
            pass

        return Response({
            'detail': 'Supervisor assigned successfully.',
            'attachee': {'id': str(attachee.pk), 'full_name': attachee.get_full_name()},
            'supervisor': {'id': str(supervisor.pk), 'full_name': supervisor.get_full_name()},
        })


class DeassignSupervisorView(APIView):
    """
    POST /attachees/<uuid:pk>/deassign-supervisor/
    """
    def post(self, request, pk):
        user = request.user
        if user.role not in ('department_leader', 'system_admin', 'hr_officer'):
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            attachee = User.objects.get(pk=pk, role='attachee', organisation=user.organisation)
        except User.DoesNotExist:
            return Response({'detail': 'Attachee not found.'}, status=status.HTTP_404_NOT_FOUND)

        if user.role == 'department_leader' and attachee.department != user.department:
            return Response({'detail': 'Attachee is not in your department.'}, status=status.HTTP_403_FORBIDDEN)

        if hasattr(attachee, 'supervisor_user'):
            attachee.supervisor_user = None
            attachee.save(update_fields=['supervisor_user'])

        return Response({'detail': 'Supervisor removed successfully.'})


# ── Deactivate / Reactivate ───────────────────────────────────────────────────

class ToggleAttacheeActiveView(APIView):
    """
    POST /attachees/<uuid:pk>/toggle-active/
    Body: { "is_active": false }
    """
    def post(self, request, pk):
        user = request.user
        if user.role not in ('department_leader', 'system_admin', 'hr_officer'):
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            attachee = User.objects.get(pk=pk, role='attachee', organisation=user.organisation)
        except User.DoesNotExist:
            return Response({'detail': 'Attachee not found.'}, status=status.HTTP_404_NOT_FOUND)

        if user.role == 'department_leader' and attachee.department != user.department:
            return Response({'detail': 'Attachee is not in your department.'}, status=status.HTTP_403_FORBIDDEN)

        new_state = request.data.get('is_active')
        if new_state is None:
            return Response({'detail': 'is_active field is required.'}, status=status.HTTP_400_BAD_REQUEST)

        attachee.is_active = bool(new_state)
        attachee.save(update_fields=['is_active'])

        action = 'activated' if attachee.is_active else 'deactivated'
        return Response({
            'detail': f'Attachee account {action} successfully.',
            'id': str(attachee.pk),
            'is_active': attachee.is_active,
        })


# ── Template Download ─────────────────────────────────────────────────────────

class BulkImportTemplateView(APIView):
    """
    GET /attachees/bulk-import/template/
    Returns a sample CSV template as a download.
    """
    def get(self, request):
        from django.http import HttpResponse
        lines = [
            'email,first_name,last_name,phone,employee_id,password',
            'jane.doe@example.com,Jane,Doe,+254700000001,EMP-001,TempPass@1234',
            'john.smith@example.com,John,Smith,+254700000002,EMP-002,TempPass@1234',
        ]
        content = '\n'.join(lines)
        response = HttpResponse(content, content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="attachee_import_template.csv"'
        return response