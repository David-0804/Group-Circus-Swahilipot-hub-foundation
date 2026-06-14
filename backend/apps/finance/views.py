from django.utils import timezone
from django.db.models import Sum, Count
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import (
    Budget, Expense, Invoice, Payroll,
    PettyCash, PurchaseOrder, Payment, Stipend, FinancialReport,
)
from .serializers import (
    BudgetSerializer, ExpenseSerializer, InvoiceSerializer, PayrollSerializer,
    PettyCashSerializer, PurchaseOrderSerializer, PaymentSerializer,
    StipendSerializer, FinancialReportSerializer,
)


# ── Budgets ───────────────────────────────────────────────────────────────────

class BudgetViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = BudgetSerializer

    def get_queryset(self):
        return Budget.objects.all()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


# ── Expenses ──────────────────────────────────────────────────────────────────

class ExpenseViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ExpenseSerializer

    def get_queryset(self):
        return Expense.objects.select_related("submitted_by", "reviewed_by", "budget").all()

    def perform_create(self, serializer):
        serializer.save(submitted_by=self.request.user)


class ExpenseActionView(APIView):
    """POST /finance/expenses/<pk>/action/  — body: { action: approve | reject | mark_paid }"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            expense = Expense.objects.get(pk=pk)
        except Expense.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get("action")
        if action == "approve":
            expense.status = "approved"
            expense.reviewed_by = request.user
            expense.reviewed_at = timezone.now()
            # increment budget used_amount
            if expense.budget:
                expense.budget.used_amount += expense.amount
                expense.budget.save(update_fields=["used_amount"])
        elif action == "reject":
            expense.status = "rejected"
            expense.reviewed_by = request.user
            expense.reviewed_at = timezone.now()
        elif action == "mark_paid":
            expense.status = "paid"
        else:
            return Response({"detail": "Invalid action."}, status=status.HTTP_400_BAD_REQUEST)

        expense.save()
        return Response(ExpenseSerializer(expense).data)


# ── Invoices ──────────────────────────────────────────────────────────────────

class InvoiceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = InvoiceSerializer

    def get_queryset(self):
        return Invoice.objects.select_related("created_by", "approved_by").all()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class InvoiceActionView(APIView):
    """POST /finance/invoices/<pk>/action/  — body: { action: approve | reject | mark_paid }"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            invoice = Invoice.objects.get(pk=pk)
        except Invoice.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get("action")
        if action == "approve":
            invoice.status = "approved"
            invoice.approved_by = request.user
        elif action == "reject":
            invoice.status = "cancelled"
        elif action == "mark_paid":
            invoice.status = "paid"
            invoice.paid_date = timezone.now().date()
        else:
            return Response({"detail": "Invalid action."}, status=status.HTTP_400_BAD_REQUEST)

        invoice.save()
        return Response(InvoiceSerializer(invoice).data)


# ── Payroll ───────────────────────────────────────────────────────────────────

class PayrollViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = PayrollSerializer

    def get_queryset(self):
        return Payroll.objects.select_related("employee", "processed_by").all()

    def perform_create(self, serializer):
        serializer.save(processed_by=self.request.user)


class ProcessPayrollView(APIView):
    """POST /finance/payroll/process/ — bulk process payroll for a period."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        period = request.data.get("period")
        pay_date = request.data.get("pay_date")
        department = request.data.get("department", "")
        payment_method = request.data.get("payment_method", "bank_transfer")
        notes = request.data.get("notes", "")

        if not period:
            return Response({"detail": "Period is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Mark all draft payroll records for this period as processed
        qs = Payroll.objects.filter(period=period, status="draft")
        if department:
            qs = qs.filter(employee__department__name=department)

        updated = qs.update(
            status="processed",
            pay_date=pay_date,
            payment_method=payment_method,
            notes=notes,
            processed_by=request.user,
        )

        return Response({
            "detail": f"Payroll processed for {updated} employee(s).",
            "period": period,
            "records_processed": updated,
        })


class PayslipView(APIView):
    """GET /finance/payroll/<pk>/payslip/ — placeholder for payslip PDF generation."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            record = Payroll.objects.select_related("employee").get(pk=pk)
        except Payroll.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        # Return payslip data; in production, generate a PDF here
        return Response({
            "employee": record.employee.get_full_name(),
            "period": record.period,
            "gross_pay": record.gross_pay,
            "deductions": record.deductions,
            "net_pay": record.net_pay,
            "payment_method": record.payment_method,
            "pay_date": record.pay_date,
            "status": record.status,
        })


# ── Petty Cash ────────────────────────────────────────────────────────────────

class PettyCashViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = PettyCashSerializer

    def get_queryset(self):
        return PettyCash.objects.select_related("requested_by", "approved_by").all()

    def perform_create(self, serializer):
        serializer.save(requested_by=self.request.user)

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        serializer = self.get_serializer(qs, many=True)
        # Include fund summary
        total_disbursed = qs.filter(status="disbursed").aggregate(t=Sum("amount"))["t"] or 0
        return Response({
            "results": serializer.data,
            "fund": {
                "opening_balance": 50000,   # replace with a FundModel lookup if you have one
                "total_disbursed": total_disbursed,
                "closing_balance": 50000 - float(total_disbursed),
            },
        })


class PettyCashActionView(APIView):
    """POST /finance/petty-cash/<pk>/action/ — body: { action: approve | reject | disburse }"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            pc = PettyCash.objects.get(pk=pk)
        except PettyCash.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get("action")
        if action == "approve":
            pc.status = "approved"
            pc.approved_by = request.user
        elif action == "reject":
            pc.status = "rejected"
            pc.approved_by = request.user
        elif action == "disburse":
            pc.status = "disbursed"
        else:
            return Response({"detail": "Invalid action."}, status=status.HTTP_400_BAD_REQUEST)

        pc.save()
        return Response(PettyCashSerializer(pc).data)


# ── Purchase Orders ───────────────────────────────────────────────────────────

class PurchaseOrderViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = PurchaseOrderSerializer

    def get_queryset(self):
        return PurchaseOrder.objects.select_related("requested_by", "approved_by", "budget").all()

    def perform_create(self, serializer):
        serializer.save(requested_by=self.request.user)


class PurchaseOrderActionView(APIView):
    """POST /finance/purchase-orders/<pk>/action/ — body: { action: approve | reject }"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            po = PurchaseOrder.objects.get(pk=pk)
        except PurchaseOrder.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get("action")
        if action == "approve":
            po.status = "approved"
            po.approved_by = request.user
            # charge to budget if linked
            if po.budget:
                po.budget.used_amount += po.amount
                po.budget.save(update_fields=["used_amount"])
        elif action == "reject":
            po.status = "rejected"
            po.approved_by = request.user
        else:
            return Response({"detail": "Invalid action."}, status=status.HTTP_400_BAD_REQUEST)

        po.save()
        return Response(PurchaseOrderSerializer(po).data)


# ── Payments ──────────────────────────────────────────────────────────────────

class PaymentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = PaymentSerializer

    def get_queryset(self):
        return Payment.objects.select_related("recorded_by", "invoice", "expense").all()

    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)


# ── Stipends ──────────────────────────────────────────────────────────────────

class StipendViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = StipendSerializer

    def get_queryset(self):
        return Stipend.objects.select_related("created_by", "processed_by").all()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ProcessStipendView(APIView):
    """POST /finance/stipends/<pk>/process/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            stipend = Stipend.objects.get(pk=pk)
        except Stipend.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        if stipend.status not in ("pending", "approved"):
            return Response({"detail": "Stipend cannot be processed in its current state."}, status=status.HTTP_400_BAD_REQUEST)

        stipend.status = "processed"
        stipend.processed_by = request.user
        stipend.save()
        return Response(StipendSerializer(stipend).data)


# ── Financial Reports ─────────────────────────────────────────────────────────

class FinancialReportViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = FinancialReportSerializer
    http_method_names = ["get", "delete"]   # generation is via dedicated endpoint

    def get_queryset(self):
        return FinancialReport.objects.select_related("generated_by").all()


class GenerateReportView(APIView):
    """POST /finance/reports/generate/ — body: { type, period? }"""
    permission_classes = [IsAuthenticated]

    REPORT_NAMES = {
        "income_statement": "Income Statement",
        "balance_sheet": "Balance Sheet",
        "cash_flow": "Cash Flow Report",
        "expense_report": "Expense Report",
    }

    def post(self, request):
        report_type = request.data.get("type", "custom")
        period = request.data.get("period", "")
        name = self.REPORT_NAMES.get(report_type, "Custom Report")
        if period:
            name = f"{name} — {period}"

        report = FinancialReport.objects.create(
            name=name,
            type=report_type,
            period=period,
            generated_by=request.user,
            # file_url would be set after actual PDF generation
        )
        return Response(FinancialReportSerializer(report).data, status=status.HTTP_201_CREATED)


# ── Cash Flow ─────────────────────────────────────────────────────────────────

class CashFlowView(APIView):
    """GET /finance/cash-flow/ — monthly income vs expenses for the past 12 months."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models.functions import TruncMonth
        from datetime import date
        from dateutil.relativedelta import relativedelta

        today = date.today()
        twelve_months_ago = today - relativedelta(months=11)

        # Income = incoming payments
        incoming = (
            Payment.objects
            .filter(type="incoming", payment_date__gte=twelve_months_ago)
            .annotate(month=TruncMonth("payment_date"))
            .values("month")
            .annotate(income=Sum("amount"))
        )
        # Expenses = approved/paid expenses
        outgoing = (
            Expense.objects
            .filter(status__in=["approved", "paid"], created_at__date__gte=twelve_months_ago)
            .annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(expenses=Sum("amount"))
        )

        # Build a full 12-month map
        data = {}
        for i in range(12):
            m = twelve_months_ago + relativedelta(months=i)
            key = m.strftime("%b")
            data[key] = {"month": key, "income": 0, "expenses": 0}

        for row in incoming:
            key = row["month"].strftime("%b")
            if key in data:
                data[key]["income"] = float(row["income"])

        for row in outgoing:
            key = row["month"].strftime("%b")
            if key in data:
                data[key]["expenses"] = float(row["expenses"])

        return Response(list(data.values()))


# ── Expense Category Breakdown ────────────────────────────────────────────────

class ExpenseCategoryBreakdownView(APIView):
    """GET /finance/expense-categories/ — totals per category for the pie chart."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        rows = (
            Expense.objects
            .filter(status__in=["approved", "paid"])
            .values("category")
            .annotate(value=Sum("amount"))
            .order_by("-value")
        )
        data = [
            {"name": row["category"].replace("_", " ").title(), "value": float(row["value"])}
            for row in rows
        ]
        return Response(data)
