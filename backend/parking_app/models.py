from django.db import models

class Vehicle(models.Model):
    vehicle_number = models.CharField(max_length=20, unique=True)
    vehicle_type = models.CharField(max_length=50) # e.g. Car, Bike, Truck
    driver_name = models.CharField(max_length=100, blank=True)
    owner_name = models.CharField(max_length=100, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    customer_type = models.CharField(max_length=20, default="casual") # casual, monthly

    def __str__(self):
        return self.vehicle_number

class ParkingSession(models.Model):
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='sessions')
    receipt_number = models.CharField(max_length=50, unique=True)
    entry_time = models.DateTimeField(auto_now_add=True)
    exit_time = models.DateTimeField(null=True, blank=True)
    parking_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    payment_method = models.CharField(max_length=20, blank=True, null=True) # CASH, UPI, FREE_MONTHLY
    payment_status = models.CharField(max_length=20, default="unpaid") # paid, unpaid
    parking_slot = models.CharField(max_length=20, blank=True)
    status = models.CharField(max_length=20, default="parked") # parked, released

    def __str__(self):
        return f"{self.vehicle.vehicle_number} ({self.receipt_number})"

class MonthlyPass(models.Model):
    vehicle = models.OneToOneField(Vehicle, on_delete=models.CASCADE, related_name='monthly_pass')
    start_date = models.DateField()
    expiry_date = models.DateField()
    monthly_fee = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, default="PENDING") # ACTIVE, EXPIRED, PENDING
    whatsapp_number = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Pass for {self.vehicle.vehicle_number}"

class MonthlyPayment(models.Model):
    pass_record = models.ForeignKey(MonthlyPass, on_delete=models.CASCADE, related_name='payments')
    payment_date = models.DateField(auto_now_add=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_status = models.CharField(max_length=20, default="PENDING") # PAID, PENDING
    renewal_date = models.DateField()
    transaction_details = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Payment {self.amount} for {self.pass_record.vehicle.vehicle_number}"

class ReminderLog(models.Model):
    pass_record = models.ForeignKey(MonthlyPass, on_delete=models.CASCADE, related_name='reminders')
    reminder_type = models.CharField(max_length=20, default="MANUAL") # 7_DAY, 3_DAY, 1_DAY, MANUAL
    message = models.TextField()
    sent_date = models.DateField(auto_now_add=True)
    reminder_status = models.CharField(max_length=20, default="SENT") # SENT, FAILED, SIMULATED, ALREADY_SENT, INVALID_NUMBER
    whatsapp_message_id = models.CharField(max_length=100, blank=True, null=True)
    error_message = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Reminder ({self.reminder_type}) to {self.pass_record.vehicle.vehicle_number} on {self.sent_date}"

class Shift(models.Model):
    operator_name = models.CharField(max_length=100)
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, default="OPEN") # OPEN, CLOSED
    total_entries = models.IntegerField(default=0)
    total_exits = models.IntegerField(default=0)
    total_revenue = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return f"Shift by {self.operator_name} ({self.status})"
