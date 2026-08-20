from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('rates', views.VehicleRateViewSet, basename='rate')

urlpatterns = [
    path('', include(router.urls)),
    path('login/', views.login_view, name='login'),
    path('shift/open/', views.open_shift, name='open_shift'),
    path('shift/current/', views.current_shift, name='current_shift'),
    path('shift/close/', views.close_shift, name='close_shift'),
    path('parking/entry/', views.record_entry, name='record_entry'),
    path('parking/search/', views.search_parked_vehicle, name='search_parked_vehicle'),
    path('parking/release/', views.release_vehicle, name='release_vehicle'),
    path('parking/history/', views.parking_history, name='parking_history'),
    path('dashboard/', views.dashboard_stats, name='dashboard_stats'),
    path('monthly-pass/add/', views.monthly_pass_add, name='monthly_pass_add'),
    path('monthly-pass/', views.monthly_pass_list, name='monthly_pass_list'),
    path('monthly-pass/search/', views.monthly_pass_search, name='monthly_pass_search'),
    path('monthly-pass/payment-update/', views.monthly_pass_payment_update, name='monthly_pass_payment_update'),
    path('monthly-pass/send-reminder/', views.monthly_pass_send_reminder, name='monthly_pass_send_reminder'),
    path('parking/check-vehicle/', views.check_vehicle, name='check_vehicle'),
    path('monthly-pass/renew/', views.renew_monthly_pass, name='renew_monthly_pass'),
    path('monthly-pass/trigger-reminders/', views.run_daily_reminders, name='run_daily_reminders'),
]
