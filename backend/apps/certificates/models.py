"""NEXUS Certificate Management — Certificates, Badges, Verification"""
import uuid
from io import BytesIO
from django.db import models
from django.utils import timezone
from django.http import HttpResponse
from rest_framework import serializers, generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from core.models import TimeStampedModel


class Certificate(TimeStampedModel):
    TYPE_CHOICES = [
        ('completion',     'Certificate of Completion'),
        ('recommendation', 'Recommendation Letter'),
        ('achievement',    'Achievement Award'),
        ('participation',  'Participation Certificate'),
    ]
    STATUS_CHOICES = [
        ('pending',   'Pending'),
        ('generated', 'Generated'),
        ('issued',    'Issued'),
        ('revoked',   'Revoked'),
    ]

    organisation        = models.ForeignKey('accounts.Organisation', on_delete=models.CASCADE, related_name='certificates')
    recipient           = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='cert_certificates')
    issued_by           = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='cert_issued_certificates')
    certificate_type    = models.CharField(max_length=20, choices=TYPE_CHOICES, default='completion')
    status              = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    certificate_number  = models.CharField(max_length=50, unique=True, blank=True)
    qr_verification_code = models.CharField(max_length=100, unique=True, blank=True)
    issue_date          = models.DateField(null=True, blank=True)
    signed_by_name      = models.CharField(max_length=200, blank=True)
    signed_by_title     = models.CharField(max_length=200, blank=True)
    pdf_file            = models.FileField(upload_to='certificates/pdfs/', null=True, blank=True)
    notes               = models.TextField(blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organisation', 'status']),
            models.Index(fields=['qr_verification_code']),
            models.Index(fields=['certificate_number']),
        ]

    def __str__(self):
        return f"{self.certificate_number} — {self.recipient}"

    def save(self, *args, **kwargs):
        if not self.certificate_number:
            year = timezone.now().year
            uid  = str(uuid.uuid4())[:6].upper()
            self.certificate_number = f"NX-{year}-{uid}"
        if not self.qr_verification_code:
            self.qr_verification_code = f"VERIFY-{str(uuid.uuid4())[:12].upper()}"
        super().save(*args, **kwargs)


class Badge(TimeStampedModel):
    organisation  = models.ForeignKey('accounts.Organisation', on_delete=models.CASCADE, related_name='badges')
    recipient     = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='cert_badges')
    certificate   = models.ForeignKey(Certificate, on_delete=models.SET_NULL, null=True, blank=True, related_name='badges')
    name          = models.CharField(max_length=200)
    description   = models.TextField(blank=True)
    icon          = models.CharField(max_length=100, blank=True)
    awarded_date  = models.DateField(default=timezone.now)

    class Meta:
        ordering = ['-awarded_date']

    def __str__(self):
        return f"{self.name} — {self.recipient}"


# ─── SERIALIZERS ─────────────────────────────────────────────────────────────

class CertificateSerializer(serializers.ModelSerializer):
    recipient_name  = serializers.CharField(source='recipient.full_name', read_only=True)
    issued_by_name  = serializers.CharField(source='issued_by.full_name',  read_only=True)

    class Meta:
        model  = Certificate
        fields = '__all__'
        read_only_fields = ['organisation', 'certificate_number', 'qr_verification_code', 'issued_by', 'status']


class BadgeSerializer(serializers.ModelSerializer):
    recipient_name = serializers.CharField(source='recipient.full_name', read_only=True)

    class Meta:
        model  = Badge
        fields = '__all__'
        read_only_fields = ['organisation']


# ─── VIEWS ───────────────────────────────────────────────────────────────────

class CertificateListView(generics.ListAPIView):
    serializer_class = CertificateSerializer

    def get_queryset(self):
        user = self.request.user
        qs   = Certificate.objects.filter(organisation=user.organisation).select_related('recipient', 'issued_by')
        if user.role in ['broadcast_student', 'attachee']:
            return qs.filter(recipient=user)
        return qs


class CertificateDetailView(generics.RetrieveAPIView):
    serializer_class = CertificateSerializer

    def get_queryset(self):
        user = self.request.user
        qs   = Certificate.objects.filter(organisation=user.organisation)
        if user.role in ['broadcast_student', 'attachee']:
            return qs.filter(recipient=user)
        return qs


class GenerateCertificateView(APIView):
    def post(self, request):
        attachee_id      = request.data.get('attachee_id')
        certificate_type = request.data.get('certificate_type', 'completion')
        signed_by_name   = request.data.get('signed_by_name', '')
        signed_by_title  = request.data.get('signed_by_title', '')

        if not attachee_id:
            return Response({'detail': 'attachee_id is required.'}, status=400)
        if not signed_by_name:
            return Response({'detail': 'signed_by_name is required.'}, status=400)

        try:
            from apps.accounts.models import User
            recipient = User.objects.get(id=attachee_id, organisation=request.user.organisation)
        except User.DoesNotExist:
            return Response({'detail': 'Recipient not found in your organisation.'}, status=404)

        cert = Certificate.objects.create(
            organisation     = request.user.organisation,
            recipient        = recipient,
            issued_by        = request.user,
            certificate_type = certificate_type,
            signed_by_name   = signed_by_name,
            signed_by_title  = signed_by_title,
            status           = 'generated',
            issue_date       = timezone.now().date(),
        )

        # Notify recipient
        try:
            from apps.notifications.services import NotificationService
            NotificationService.notify_user(
                recipient,
                f"Certificate Issued — {cert.get_certificate_type_display()}",
                f"Your {cert.get_certificate_type_display()} has been generated. Certificate number: {cert.certificate_number}",
                'certificate_issued',
            )
        except Exception:
            pass

        return Response(CertificateSerializer(cert).data, status=201)


class DownloadCertificateView(APIView):
    def get(self, request, pk):
        try:
            user = request.user
            qs   = Certificate.objects.filter(organisation=user.organisation)
            if user.role in ['broadcast_student', 'attachee']:
                qs = qs.filter(recipient=user)
            cert = qs.get(pk=pk)
        except Certificate.DoesNotExist:
            return Response({'detail': 'Certificate not found.'}, status=404)

        if cert.status not in ['generated', 'issued']:
            return Response({'detail': 'Certificate is not ready for download.'}, status=400)

        # Return existing PDF if already generated
        if cert.pdf_file:
            response = HttpResponse(cert.pdf_file.read(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="certificate-{cert.certificate_number}.pdf"'
            return response

        # Generate PDF on the fly using reportlab if available
        try:
            pdf_bytes = _generate_pdf(cert)
            response  = HttpResponse(pdf_bytes, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="certificate-{cert.certificate_number}.pdf"'
            # Optionally persist
            from django.core.files.base import ContentFile
            cert.pdf_file.save(f"{cert.certificate_number}.pdf", ContentFile(pdf_bytes), save=True)
            cert.status = 'issued'
            cert.save(update_fields=['status'])
            return response
        except Exception as e:
            return Response({'detail': f'PDF generation failed: {str(e)}'}, status=500)


def _generate_pdf(cert: Certificate) -> bytes:
    """
    Generate a certificate PDF styled after the University of Illinois template:
    - White background with a thin decorative border
    - Small crest/shield icon at the top centre
    - Large spaced institution name
    - 'Proudly presented to:' in italic
    - Recipient name in large bold serif-style font
    - Award body paragraph
    - Two signature blocks (Dean / President) + cert number + date at bottom
    - Small QR code bottom-right
    """
    import qrcode
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib import colors
    from reportlab.lib.units import cm
    from reportlab.platypus import Paragraph
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib.enums import TA_CENTER

    W, H = landscape(A4)   # 841.9 × 595.3 pts
    cx   = W / 2

    verify_url = f"http://localhost:5173/verify/{cert.qr_verification_code}"

    # ── QR Code ──────────────────────────────────────────────────────────────
    qr = qrcode.QRCode(version=2, box_size=8, border=2,
                       error_correction=qrcode.constants.ERROR_CORRECT_H)
    qr.add_data(verify_url)
    qr.make(fit=True)
    qr_img    = qr.make_image(fill_color=(60, 60, 60), back_color=(255, 255, 255))
    qr_buffer = BytesIO()
    qr_img.save(qr_buffer, format='PNG')
    qr_buffer.seek(0)

    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=landscape(A4))

    # ── Colour palette ───────────────────────────────────────────────────────
    white      = colors.white
    off_white  = colors.HexColor('#fafaf8')
    dark_navy  = colors.HexColor('#1a1a2e')
    mid_grey   = colors.HexColor('#555555')
    light_grey = colors.HexColor('#888888')
    border_col = colors.HexColor('#cccccc')
    crest_red  = colors.HexColor('#8b1a1a')   # deep red for the crest shield

    # ── Background ───────────────────────────────────────────────────────────
    c.setFillColor(off_white)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # ── Outer decorative border (double-line effect) ──────────────────────────
    pad1 = 0.55 * cm
    pad2 = 0.75 * cm

    c.setStrokeColor(border_col)
    c.setLineWidth(3.0)
    c.rect(pad1, pad1, W - 2*pad1, H - 2*pad1, fill=0, stroke=1)

    c.setLineWidth(0.8)
    c.rect(pad2, pad2, W - 2*pad2, H - 2*pad2, fill=0, stroke=1)

    # ── Crest / shield shape at top centre ───────────────────────────────────
    # Draw a simple filled shield polygon
    shield_cx  = cx
    shield_top = H - 1.6 * cm
    sw, sh     = 1.0 * cm, 1.3 * cm   # half-width, full height

    shield_path = c.beginPath()
    shield_path.moveTo(shield_cx - sw, shield_top)
    shield_path.lineTo(shield_cx + sw, shield_top)
    shield_path.lineTo(shield_cx + sw, shield_top - sh * 0.6)
    shield_path.curveTo(
        shield_cx + sw, shield_top - sh,
        shield_cx,       shield_top - sh,
        shield_cx,       shield_top - sh,
    )
    shield_path.curveTo(
        shield_cx,       shield_top - sh,
        shield_cx - sw, shield_top - sh,
        shield_cx - sw, shield_top - sh * 0.6,
    )
    shield_path.close()

    c.setFillColor(crest_red)
    c.drawPath(shield_path, fill=1, stroke=0)

    # Small white star inside the shield
    c.setFillColor(white)
    c.setFont('Helvetica-Bold', 11)
    c.drawCentredString(shield_cx, shield_top - sh * 0.58, '✦')

    # ── Organisation / Institution name ───────────────────────────────────────
    org_name = (cert.organisation.name if cert.organisation and cert.organisation.name
                else 'NEXUS ENTERPRISE').upper()

    c.setFillColor(dark_navy)
    c.setFont('Helvetica-Bold', 26)
    c.drawCentredString(cx, H - 3.5 * cm, org_name)

    # ── Thin rule under org name ──────────────────────────────────────────────
    rule_y = H - 3.9 * cm
    c.setStrokeColor(border_col)
    c.setLineWidth(0.6)
    c.line(cx - 8 * cm, rule_y, cx + 8 * cm, rule_y)

    # ── "Proudly presented to:" ───────────────────────────────────────────────
    c.setFillColor(mid_grey)
    c.setFont('Helvetica-Oblique', 11)
    c.drawCentredString(cx, H - 4.7 * cm, 'Proudly presented to:')

    # ── Recipient name (large, bold) ──────────────────────────────────────────
    c.setFillColor(dark_navy)
    c.setFont('Helvetica-Bold', 34)
    c.drawCentredString(cx, H - 6.1 * cm, cert.recipient.full_name)

    # ── Body paragraph ────────────────────────────────────────────────────────
    programme_label = cert.get_certificate_type_display()
    body_line1 = (
        f'For hastily completing the '
        f'{programme_label} program.'
    )
    body_line2 = (
        'Through dedication and hard work, you have demonstrated a high level of academic'
    )
    body_line3 = 'excellence and professional competence.'

    c.setFillColor(mid_grey)
    c.setFont('Helvetica', 10.5)
    body_y = H - 7.35 * cm

    # Line 1 — with bold programme name inlined manually
    prefix   = 'For hastily completing the '
    bold_bit = programme_label + ' program.'
    px = cx - c.stringWidth(prefix + bold_bit, 'Helvetica', 10.5) / 2
    c.drawString(px, body_y, prefix)
    px2 = px + c.stringWidth(prefix, 'Helvetica', 10.5)
    c.setFont('Helvetica-Bold', 10.5)
    c.drawString(px2, body_y, bold_bit)

    c.setFont('Helvetica', 10.5)
    c.drawCentredString(cx, body_y - 0.55 * cm, body_line2)
    c.drawCentredString(cx, body_y - 1.05 * cm, body_line3)

    # ── Bottom section: two signatures + cert info ────────────────────────────
    sig_y      = 2.8 * cm   # baseline for sig names
    sig_label_y = 1.9 * cm  # baseline for titles
    sig_line_y  = sig_y + 0.5 * cm

    col_left  = cx - 7.0 * cm   # Dean of Faculties
    col_right = cx + 7.0 * cm   # President of University

    for col_x, name, title in [
        (col_left,  cert.signed_by_name or '—',
         cert.signed_by_title or 'Dean of Faculties'),
        (col_right, cert.organisation.name if cert.organisation else 'Nexus',
         'President of Organisation'),
    ]:
        # Signature squiggle (simple hand-drawn curve approximation)
        c.saveState()
        c.setStrokeColor(mid_grey)
        c.setLineWidth(1.0)
        sig_w = 2.5 * cm
        sx = col_x - sig_w / 2
        sy = sig_line_y + 0.15 * cm
        p = c.beginPath()
        p.moveTo(sx, sy)
        p.curveTo(sx + sig_w*0.2, sy + 0.35*cm,
                  sx + sig_w*0.5, sy - 0.25*cm,
                  sx + sig_w*0.7, sy + 0.2*cm)
        p.curveTo(sx + sig_w*0.85, sy + 0.4*cm,
                  sx + sig_w,     sy + 0.1*cm,
                  sx + sig_w,     sy)
        c.drawPath(p, fill=0, stroke=1)
        c.restoreState()

        # Horizontal line under sig
        c.setStrokeColor(border_col)
        c.setLineWidth(0.7)
        c.line(col_x - 2.8*cm, sig_line_y, col_x + 2.8*cm, sig_line_y)

        # Name
        c.setFillColor(dark_navy)
        c.setFont('Helvetica-Bold', 10)
        c.drawCentredString(col_x, sig_y, name)

        # Title
        c.setFillColor(light_grey)
        c.setFont('Helvetica', 8.5)
        c.drawCentredString(col_x, sig_label_y, title)

    # ── Centre bottom: cert number + date ────────────────────────────────────
    issue_str = cert.issue_date.strftime('%d.%m.%Y') if cert.issue_date else '—'

    c.setFillColor(light_grey)
    c.setFont('Helvetica', 8)
    c.drawCentredString(cx, sig_y + 0.15*cm, f'Certificate No: {cert.certificate_number}')
    c.drawCentredString(cx, sig_label_y,      f'Awarded on: {issue_str}')

    # ── QR Code (bottom-right, inside border) ────────────────────────────────
    from reportlab.lib.utils import ImageReader
    qr_size = 1.9 * cm
    qr_x    = W - pad2 - qr_size - 0.35 * cm
    qr_y    = pad2 + 0.1 * cm

    c.setFillColor(white)
    c.roundRect(qr_x - 0.1*cm, qr_y - 0.1*cm,
                qr_size + 0.2*cm, qr_size + 0.35*cm, 2, fill=1, stroke=0)
    c.drawImage(ImageReader(qr_buffer), qr_x, qr_y,
                width=qr_size, height=qr_size, preserveAspectRatio=True)
    c.setFillColor(light_grey)
    c.setFont('Helvetica', 5.5)
    c.drawCentredString(qr_x + qr_size / 2, qr_y - 0.08*cm, 'SCAN TO VERIFY')

    c.save()
    return buffer.getvalue()


class VerifyCertificateView(APIView):
    permission_classes = []  # Public endpoint

    def get(self, request, code):
        try:
            cert = Certificate.objects.select_related('recipient', 'issued_by').get(
                qr_verification_code=code
            )
        except Certificate.DoesNotExist:
            return Response({'valid': False, 'detail': 'Certificate not found.'}, status=404)

        return Response({
            'valid':               cert.status not in ['revoked', 'pending'],
            'certificate_number':  cert.certificate_number,
            'certificate_type':    cert.get_certificate_type_display(),
            'recipient_name':      cert.recipient.full_name,
            'issue_date':          cert.issue_date,
            'signed_by_name':      cert.signed_by_name,
            'signed_by_title':     cert.signed_by_title,
            'status':              cert.status,
            'organisation':        cert.organisation.name,
        })


class BadgeListView(generics.ListAPIView):
    serializer_class = BadgeSerializer

    def get_queryset(self):
        user = self.request.user
        qs   = Badge.objects.filter(organisation=user.organisation).select_related('recipient')
        if user.role in ['broadcast_student', 'attachee']:
            return qs.filter(recipient=user)
        return qs