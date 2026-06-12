"""Nexus FM Report — URL Configuration"""
from django.urls import path
from .models import (
    FMStationListView, FMStationDetailView,
    ReportFMDownView, ReportFMRestoredView,
    FMOutageHistoryView, EmergencyAlertView,
    AcknowledgeAlertView, fm_heartbeat_receive,
)

urlpatterns = [
    # FM Stations
    path('stations/',                      FMStationListView.as_view(),    name='fm-station-list'),
    path('stations/<uuid:pk>/',            FMStationDetailView.as_view(),  name='fm-station-detail'),
    path('stations/<uuid:station_id>/down/',     ReportFMDownView.as_view(),     name='fm-report-down'),
    path('stations/<uuid:station_id>/restored/', ReportFMRestoredView.as_view(), name='fm-report-restored'),
    path('stations/<uuid:station_id>/outages/',  FMOutageHistoryView.as_view(),  name='fm-outage-history'),

    # Heartbeat (called by transmitter hardware)
    path('stations/<uuid:station_id>/heartbeat/', fm_heartbeat_receive,     name='fm-heartbeat'),

    # All outages (for history table + export)
    path('outages/',                       FMOutageHistoryView.as_view(),  name='fm-all-outages'),

    # Emergency alerts
    path('emergency-alert/',               EmergencyAlertView.as_view(),   name='emergency-alert'),
    path('emergency-alert/<uuid:alert_id>/acknowledge/', AcknowledgeAlertView.as_view(), name='acknowledge-alert'),
]
