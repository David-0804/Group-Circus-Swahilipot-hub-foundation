<<<<<<< HEAD
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'budgets', views.BudgetViewSet, basename='budget')
router.register(r'expenses', views.ExpenseViewSet, basename='expense')
router.register(r'invoices', views.InvoiceViewSet, basename='invoice')
router.register(r'payroll', views.PayrollViewSet, basename='payroll')
router.register(r'petty-cash', views.PettyCashViewSet, basename='petty-cash')
router.register(r'purchase-orders', views.PurchaseOrderViewSet, basename='purchase-order')
router.register(r'payments', views.PaymentViewSet, basename='payment')
router.register(r'stipends', views.StipendViewSet, basename='stipend')
router.register(r'reports', views.FinancialReportViewSet, basename='financial-report')

urlpatterns = [
    path('', include(router.urls)),

    # ── Cash Flow ──────────────────────────────────────────────────────────────
    path('cash-flow/', views.CashFlowView.as_view(), name='cash-flow'),

    # ── Expense Categories breakdown ───────────────────────────────────────────
    path('expense-categories/', views.ExpenseCategoryBreakdownView.as_view(), name='expense-categories'),

    # ── Expense approval actions ───────────────────────────────────────────────
    path('expenses/<uuid:pk>/action/', views.ExpenseActionView.as_view(), name='expense-action'),

    # ── Invoice approval / status actions ─────────────────────────────────────
    path('invoices/<uuid:pk>/action/', views.InvoiceActionView.as_view(), name='invoice-action'),

    # ── Petty cash approval actions ────────────────────────────────────────────
    path('petty-cash/<uuid:pk>/action/', views.PettyCashActionView.as_view(), name='petty-cash-action'),

    # ── Purchase order approval actions ───────────────────────────────────────
    path('purchase-orders/<uuid:pk>/action/', views.PurchaseOrderActionView.as_view(), name='purchase-order-action'),

    # ── Stipend processing ─────────────────────────────────────────────────────
    path('stipends/<uuid:pk>/process/', views.ProcessStipendView.as_view(), name='stipend-process'),

    # ── Payroll processing (bulk) ──────────────────────────────────────────────
    path('payroll/process/', views.ProcessPayrollView.as_view(), name='payroll-process'),

    # ── Payslip download ───────────────────────────────────────────────────────
    path('payroll/<uuid:pk>/payslip/', views.PayslipView.as_view(), name='payslip'),

    # ── Report generation ──────────────────────────────────────────────────────
    path('reports/generate/', views.GenerateReportView.as_view(), name='generate-report'),
]
=======
from django.urls import path
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

class ModuleView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, **kwargs):
        return Response({'status': 'active'})
    def post(self, request, **kwargs):
        return Response({'status': 'created'}, status=201)
    def patch(self, request, **kwargs):
        return Response({'status': 'updated'})
    def delete(self, request, **kwargs):
        return Response(status=204)

urlpatterns = [
    path('', ModuleView.as_view()),
    path('<uuid:pk>/', ModuleView.as_view()),
]
>>>>>>> origin/main
