from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    VehicleViewSet,
    ParkingSessionViewSet,
    MonthlyPassViewSet,
    MonthlyPaymentViewSet,
    DashboardStatsViewSet,
    ShiftViewSet,
    ReportViewSet
)

router = DefaultRouter()
router.register(r"vehicles", VehicleViewSet, basename="vehicle")
router.register(r"sessions", ParkingSessionViewSet, basename="session")
router.register(r"passes", MonthlyPassViewSet, basename="pass")
router.register(r"payments", MonthlyPaymentViewSet, basename="payment")
router.register(r"dashboard", DashboardStatsViewSet, basename="dashboard")
router.register(r"shifts", ShiftViewSet, basename="shift")
router.register(r"reports", ReportViewSet, basename="report")

urlpatterns = router.urls
