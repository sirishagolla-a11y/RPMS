from rest_framework import serializers
from .models import Vehicle, ParkingSession, MonthlyPass, MonthlyPayment, ReminderLog, Shift

class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = "__all__"

class ParkingSessionSerializer(serializers.ModelSerializer):
    vehicle_number = serializers.ReadOnlyField(source='vehicle.vehicle_number')
    vehicle_type = serializers.ReadOnlyField(source='vehicle.vehicle_type')

    class Meta:
        model = ParkingSession
        fields = "__all__"

class MonthlyPassSerializer(serializers.ModelSerializer):
    vehicle_number = serializers.CharField(source='vehicle.vehicle_number', read_only=True)
    vehicle_type = serializers.CharField(source='vehicle.vehicle_type', read_only=True)
    owner_name = serializers.CharField(source='vehicle.owner_name', read_only=True)
    phone_number = serializers.CharField(source='vehicle.phone_number', read_only=True)

    class Meta:
        model = MonthlyPass
        fields = "__all__"

class MonthlyPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = MonthlyPayment
        fields = "__all__"

class ReminderLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReminderLog
        fields = "__all__"

class ShiftSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shift
        fields = "__all__"
