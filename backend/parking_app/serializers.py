from rest_framework import serializers
from .models import VehicleRate, Shift, ParkingRecord, Customer, MonthlySubscription, ReminderLog, MonthlyPayment

class VehicleRateSerializer(serializers.ModelSerializer):
    class Meta:
        model = VehicleRate
        fields = '__all__'


class ShiftSerializer(serializers.ModelSerializer):
    duration_hours = serializers.SerializerMethodField()
    total_revenue = serializers.SerializerMethodField()
    cash_revenue = serializers.SerializerMethodField()
    upi_revenue = serializers.SerializerMethodField()
    total_vehicles = serializers.SerializerMethodField()

    class Meta:
        model = Shift
        fields = '__all__'

    def get_duration_hours(self, obj):
        if obj.end_time:
            diff = obj.end_time - obj.start_time
            return round(diff.total_seconds() / 3600, 2)
        return round((timezone_now() - obj.start_time).total_seconds() / 3600, 2) if hasattr(self, '_now') else 0

    def get_total_revenue(self, obj):
        records = obj.records.filter(status='RELEASED')
        return sum(r.fee_amount or 0 for r in records)

    def get_cash_revenue(self, obj):
        records = obj.records.filter(status='RELEASED', payment_method='CASH')
        return sum(r.fee_amount or 0 for r in records)

    def get_upi_revenue(self, obj):
        records = obj.records.filter(status='RELEASED', payment_method='UPI')
        return sum(r.fee_amount or 0 for r in records)

    def get_total_vehicles(self, obj):
        return obj.records.count()


# Helper to get timezone aware now in serializer
from django.utils import timezone
def timezone_now():
    return timezone.now()


class CustomerSerializer(serializers.ModelSerializer):
    vehicle_type = serializers.PrimaryKeyRelatedField(queryset=VehicleRate.objects.all())

    class Meta:
        model = Customer
        fields = ['id', 'vehicle_number', 'owner_name', 'phone_number', 'vehicle_type', 'is_active']


class MonthlySubscriptionSerializer(serializers.ModelSerializer):
    customer = serializers.PrimaryKeyRelatedField(queryset=Customer.objects.all())

    class Meta:
        model = MonthlySubscription
        fields = ['id', 'customer', 'month', 'year', 'amount', 'payment_status', 'payment_date', 'start_date', 'end_date', 'whatsapp_sent', 'reminder_sent_date']


class ParkingRecordSerializer(serializers.ModelSerializer):
    vehicle_type_details = VehicleRateSerializer(source='vehicle_type', read_only=True)
    duration_minutes = serializers.SerializerMethodField()
    calculated_fee = serializers.SerializerMethodField()

    class Meta:
        model = ParkingRecord
        fields = '__all__'
        read_only_fields = ['receipt_number', 'entry_date', 'entry_time', 'exit_date', 'exit_time', 'fee_amount', 'status']

    def get_duration_minutes(self, obj):
        end = obj.exit_time or timezone.now()
        diff = end - obj.entry_time
        return int(diff.total_seconds() / 60)

    def get_calculated_fee(self, obj):
        # Returns current fee calculation dynamically
        end = obj.exit_time or timezone.now()
        diff = end - obj.entry_time
        hours = max(1, -(-int(diff.total_seconds() / 60) // 60)) # ceiling division
        
        rate = obj.vehicle_type
        fee = rate.minimum_charge + (rate.hourly_rate * hours)
        return float(fee)


class ReminderLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReminderLog
        fields = '__all__'


class MonthlyPaymentSerializer(serializers.ModelSerializer):
    customer_details = CustomerSerializer(source='customer', read_only=True)
    class Meta:
        model = MonthlyPayment
        fields = '__all__'
