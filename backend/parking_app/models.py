from django.db import models
from django.utils import timezone
from django.contrib.auth.models import AbstractUser
import datetime
import random

class User(AbstractUser):
    role = models.CharField(max_length=20, default='OPERATOR')

class VehicleRate(models.Model):
    VEHICLE_CHOICES = [
        ('BIKE', 'Bike'),
        ('SCOOTER', 'Scooter'),
        ('CAR', 'Car'),
        ('AUTO', 'Auto'),
    ]
    
    vehicle_type = models.CharField(max_length=15, choices=VEHICLE_CHOICES, unique=True)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2)
    minimum_charge = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.get_vehicle_type_display()} (Min: {self.minimum_charge}, Hr: {self.hourly_rate})"


class Shift(models.Model):
    STATUS_CHOICES = [
        ('OPEN', 'Open'),
        ('CLOSED', 'Closed'),
    ]
    
    operator_name = models.CharField(max_length=100)
    shift_date = models.DateField(default=timezone.now)
    start_time = models.DateTimeField(default=timezone.now)
    end_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='OPEN')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Shift by {self.operator_name} on {self.shift_date} ({self.status})"


class Customer(models.Model):
    VEHICLE_TYPE_CHOICES = [
        ('BIKE', 'Bike'),
        ('SCOOTER', 'Scooter'),
        ('CAR', 'Car'),
        ('AUTO', 'Auto'),
    ]

    vehicle_number = models.CharField(max_length=20, unique=True)
    owner_name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=20)
    vehicle_type = models.ForeignKey(VehicleRate, on_delete=models.PROTECT, related_name='customers')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.owner_name} - {self.vehicle_number}"


class MonthlySubscription(models.Model):
    PAYMENT_STATUS_CHOICES = [
        ('PAID', 'Paid'),
        ('PENDING', 'Pending'),
        ('OVERDUE', 'Overdue'),
    ]

    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='subscriptions')
    month = models.IntegerField()
    year = models.IntegerField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_status = models.CharField(max_length=10, choices=PAYMENT_STATUS_CHOICES, default='PENDING')
    payment_date = models.DateField(null=True, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    whatsapp_sent = models.BooleanField(default=False)
    reminder_sent_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('customer', 'month', 'year')

    def __str__(self):
        return f"{self.customer.vehicle_number} - {self.month}/{self.year} - {self.payment_status}"


class ParkingRecord(models.Model):
    STATUS_CHOICES = [
        ('PARKED', 'Parked'),
        ('RELEASED', 'Released'),
    ]
    
    PAYMENT_CHOICES = [
        ('CASH', 'Cash'),
        ('UPI', 'UPI'),
    ]

    CUSTOMER_TYPE_CHOICES = [
        ('CASUAL', 'Casual'),
        ('MONTHLY', 'Monthly'),
    ]
    
    shift = models.ForeignKey(Shift, on_delete=models.CASCADE, related_name='records')
    vehicle_type = models.ForeignKey(VehicleRate, on_delete=models.PROTECT, related_name='records')
    receipt_number = models.CharField(max_length=50, unique=True, blank=True)
    vehicle_number = models.CharField(max_length=20)
    customer_name = models.CharField(max_length=100, null=True, blank=True)
    customer_phone = models.CharField(max_length=20, null=True, blank=True)
    customer_type = models.CharField(max_length=10, choices=CUSTOMER_TYPE_CHOICES, default='CASUAL')
    
    entry_date = models.DateField(default=timezone.now)
    entry_time = models.DateTimeField(default=timezone.now)
    
    exit_date = models.DateField(null=True, blank=True)
    exit_time = models.DateTimeField(null=True, blank=True)
    
    fee_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    monthly_customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name='parking_records')
    payment_method = models.CharField(max_length=10, choices=PAYMENT_CHOICES, null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PARKED')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.receipt_number:
            date_str = timezone.now().strftime('%Y%m%d')
            # Generate a unique receipt number
            while True:
                random_str = ''.join(random.choices('0123456789', k=5))
                receipt_no = f"PRK-{date_str}-{random_str}"
                if not ParkingRecord.objects.filter(receipt_number=receipt_no).exists():
                    self.receipt_number = receipt_no
                    break
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.receipt_number} - {self.vehicle_number} ({self.status})"


class ReminderLog(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='reminders')
    subscription = models.ForeignKey(MonthlySubscription, on_delete=models.SET_NULL, null=True, blank=True, related_name='reminders')
    date = models.DateField(default=timezone.now)
    reminder_type = models.CharField(max_length=20)  # 'EXPIRING' or 'EXPIRED'
    message = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.customer.vehicle_number} - {self.reminder_type} on {self.date}"


class MonthlyPayment(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='monthly_payments')
    subscription = models.ForeignKey(MonthlySubscription, on_delete=models.SET_NULL, null=True, blank=True, related_name='monthly_payments')
    receipt_number = models.CharField(max_length=50, unique=True, blank=True)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateField(default=timezone.now)
    payment_method = models.CharField(max_length=10, choices=[('CASH', 'Cash'), ('UPI', 'UPI')])
    operator_name = models.CharField(max_length=100)
    next_expiry_date = models.DateField()
    status = models.CharField(max_length=10, default='PAID')
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.receipt_number:
            date_str = timezone.now().strftime('%Y%m%d')
            while True:
                random_str = ''.join(random.choices('0123456789', k=5))
                receipt_no = f"PAY-{date_str}-{random_str}"
                if not MonthlyPayment.objects.filter(receipt_number=receipt_no).exists():
                    self.receipt_number = receipt_no
                    break
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.receipt_number} - {self.customer.vehicle_number} (₹{self.amount_paid})"
