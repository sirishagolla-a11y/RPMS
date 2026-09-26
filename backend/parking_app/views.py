from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Sum, Q
import datetime
import uuid

from .models import Vehicle, ParkingSession, MonthlyPass, MonthlyPayment, ReminderLog, Shift
from .serializers import (
    VehicleSerializer,
    ParkingSessionSerializer,
    MonthlyPassSerializer,
    MonthlyPaymentSerializer,
    ReminderLogSerializer,
    ShiftSerializer
)

class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all().order_by("vehicle_number")
    serializer_class = VehicleSerializer

class ParkingSessionViewSet(viewsets.ModelViewSet):
    queryset = ParkingSession.objects.all().order_by("-entry_time")
    serializer_class = ParkingSessionSerializer

    @action(detail=False, methods=["get"])
    def parked(self, request):
        parked = ParkingSession.objects.filter(status="parked")
        serializer = self.get_serializer(parked, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["post"])
    def check_entry(self, request):
        vehicle_number = request.data.get("vehicle_number", "").strip().upper()
        vehicle_type = request.data.get("vehicle_type", "Car")
        driver_name = request.data.get("driver_name", "")
        parking_slot = request.data.get("parking_slot", "")

        if not vehicle_number:
            return Response({"error": "Vehicle number is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Get or create vehicle
        vehicle, created = Vehicle.objects.get_or_create(
            vehicle_number=vehicle_number,
            defaults={"vehicle_type": vehicle_type, "driver_name": driver_name}
        )
        if not created:
            if vehicle_type:
                vehicle.vehicle_type = vehicle_type
            if driver_name:
                vehicle.driver_name = driver_name
            vehicle.save()

        # Check if active monthly pass exists
        now_date = timezone.now().date()
        active_pass = None
        try:
            active_pass = MonthlyPass.objects.get(
                vehicle=vehicle,
                status="ACTIVE",
                start_date__lte=now_date,
                expiry_date__gte=now_date
            )
        except MonthlyPass.DoesNotExist:
            pass

        # Generate receipt number
        receipt_seq = timezone.now().strftime("%Y%m%d%H%M%S") + "-" + uuid.uuid4().hex[:4].upper()
        receipt_number = f"REC-{receipt_seq}"

        is_monthly_active = active_pass is not None

        if is_monthly_active:
            vehicle.customer_type = "monthly"
            vehicle.save()
            session = ParkingSession.objects.create(
                vehicle=vehicle,
                receipt_number=receipt_number,
                parking_slot=parking_slot,
                parking_fee=0.00,
                payment_method="FREE_MONTHLY",
                payment_status="paid",
                status="parked"
            )
            serializer = self.get_serializer(session)
            return Response({
                "session": serializer.data,
                "message": "Monthly Pass Active",
                "is_monthly": True
            }, status=status.HTTP_201_CREATED)
        else:
            session = ParkingSession.objects.create(
                vehicle=vehicle,
                receipt_number=receipt_number,
                parking_slot=parking_slot,
                parking_fee=0.00,
                payment_method=None,
                payment_status="unpaid",
                status="parked"
            )
            serializer = self.get_serializer(session)
            return Response({
                "session": serializer.data,
                "message": "Casual vehicle entry recorded",
                "is_monthly": False
            }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def release(self, request, pk=None):
        session = self.get_object()
        if session.status == "released":
            return Response({"error": "Vehicle already released"}, status=status.HTTP_400_BAD_REQUEST)

        payment_method = request.data.get("payment_method", "Cash")
        exit_time = timezone.now()
        session.exit_time = exit_time

        # Calculate duration and fee
        duration = exit_time - session.entry_time
        duration_hours = max(1, int(duration.total_seconds() / 3600 + 0.99)) # round up to next hour

        # Check if it was registered under a monthly active pass at entry
        if session.payment_method == "FREE_MONTHLY":
            session.parking_fee = 0.00
            session.payment_status = "paid"
        else:
            # Casual rates: Car = 30/hr, Bike = 10/hr, Truck/Other = 50/hr
            rate = 10
            v_type = session.vehicle.vehicle_type.lower()
            if "car" in v_type or "suv" in v_type:
                rate = 30
            elif "truck" in v_type or "bus" in v_type:
                rate = 50
            
            session.parking_fee = duration_hours * rate
            session.payment_method = payment_method
            session.payment_status = "paid"

        session.status = "released"
        session.save()
        serializer = self.get_serializer(session)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"])
    def ai_check(self, request):
        vehicle_number = request.data.get("vehicle_number", "").strip().upper()
        if not vehicle_number:
            return Response({"error": "No vehicle number provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get vehicle or create it
        vehicle, created = Vehicle.objects.get_or_create(
            vehicle_number=vehicle_number,
            defaults={"vehicle_type": "Car"}
        )
        
        # Check active monthly pass
        now_date = timezone.now().date()
        active_pass = None
        try:
            active_pass = MonthlyPass.objects.get(
                vehicle=vehicle,
                status="ACTIVE",
                start_date__lte=now_date,
                expiry_date__gte=now_date
            )
        except MonthlyPass.DoesNotExist:
            pass
            
        is_monthly = active_pass is not None
        
        # Create parking session
        receipt_seq = timezone.now().strftime("%Y%m%d%H%M%S") + "-" + uuid.uuid4().hex[:4].upper()
        receipt_number = f"REC-AI-{receipt_seq}"
        
        if is_monthly:
            session = ParkingSession.objects.create(
                vehicle=vehicle,
                receipt_number=receipt_number,
                parking_slot="AI-AUTO",
                parking_fee=0.00,
                payment_method="FREE_MONTHLY",
                payment_status="paid",
                status="parked"
            )
            return Response({
                "status": "success",
                "is_monthly": True,
                "message": "Monthly Pass Active",
                "receipt_number": receipt_number,
                "owner_name": vehicle.owner_name,
                "phone_number": vehicle.phone_number
            }, status=status.HTTP_200_OK)
        else:
            session = ParkingSession.objects.create(
                vehicle=vehicle,
                receipt_number=receipt_number,
                parking_slot="AI-AUTO",
                parking_fee=0.00,
                payment_status="unpaid",
                status="parked"
            )
            return Response({
                "status": "success",
                "is_monthly": False,
                "message": "Casual vehicle check-in completed",
                "receipt_number": receipt_number
            }, status=status.HTTP_200_OK)

class MonthlyPassViewSet(viewsets.ModelViewSet):
    queryset = MonthlyPass.objects.all().order_by("-id")
    serializer_class = MonthlyPassSerializer

    def create(self, request, *args, **kwargs):
        v_num = request.data.get("vehicle_number", "").strip().upper()
        v_type = request.data.get("vehicle_type", "Car")
        owner_name = request.data.get("owner_name", "")
        phone_number = request.data.get("phone_number", "")
        
        if not v_num:
            return Response({"error": "Vehicle number is required"}, status=status.HTTP_400_BAD_REQUEST)

        vehicle, _ = Vehicle.objects.get_or_create(
            vehicle_number=v_num,
            defaults={
                "vehicle_type": v_type,
                "driver_name": owner_name,
                "owner_name": owner_name,
                "phone_number": phone_number,
                "customer_type": "monthly"
            }
        )
        vehicle.customer_type = "monthly"
        vehicle.owner_name = owner_name
        vehicle.phone_number = phone_number
        vehicle.save()

        start_date = request.data.get("start_date", timezone.now().date())
        expiry_date = request.data.get("expiry_date")
        monthly_fee = request.data.get("monthly_fee", 300.00)
        status_val = request.data.get("status", "ACTIVE")
        whatsapp_number = request.data.get("whatsapp_number", phone_number)
        address = request.data.get("address", "")

        m_pass, created = MonthlyPass.objects.get_or_create(
            vehicle=vehicle,
            defaults={
                "start_date": start_date,
                "expiry_date": expiry_date,
                "monthly_fee": monthly_fee,
                "status": status_val,
                "whatsapp_number": whatsapp_number,
                "address": address
            }
        )

        if not created:
            m_pass.start_date = start_date
            m_pass.expiry_date = expiry_date
            m_pass.monthly_fee = monthly_fee
            m_pass.status = status_val
            m_pass.whatsapp_number = whatsapp_number
            m_pass.address = address
            m_pass.save()

        pay_status = "PAID" if status_val == "ACTIVE" else "PENDING"
        MonthlyPayment.objects.create(
            pass_record=m_pass,
            amount=monthly_fee,
            payment_status=pay_status,
            renewal_date=expiry_date,
            transaction_details="Initial pass registration"
        )

        serializer = self.get_serializer(m_pass)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def renew(self, request, pk=None):
        m_pass = self.get_object()
        start_date = request.data.get("start_date")
        expiry_date = request.data.get("expiry_date")
        amount = request.data.get("amount", m_pass.monthly_fee)
        pay_status = request.data.get("payment_status", "PAID")

        m_pass.start_date = start_date
        m_pass.expiry_date = expiry_date
        m_pass.status = "ACTIVE" if pay_status == "PAID" else "PENDING"
        m_pass.save()

        MonthlyPayment.objects.create(
            pass_record=m_pass,
            amount=amount,
            payment_status=pay_status,
            renewal_date=expiry_date,
            transaction_details=request.data.get("transaction_details", "Pass Renewal")
        )

        serializer = self.get_serializer(m_pass)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"])
    def payments(self, request, pk=None):
        m_pass = self.get_object()
        payments = MonthlyPayment.objects.filter(pass_record=m_pass).order_by("-payment_date")
        serializer = MonthlyPaymentSerializer(payments, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def expiring_summary(self, request):
        today = timezone.now().date()
        target_limit = today + datetime.timedelta(days=7)
        expiring = MonthlyPass.objects.filter(expiry_date__lte=target_limit, status="ACTIVE").order_by("expiry_date")
        
        data = []
        for p in expiring:
            days_left = (p.expiry_date - today).days
            last_reminder = ReminderLog.objects.filter(pass_record=p).order_by("-id").first()
            data.append({
                "id": p.id,
                "vehicle_number": p.vehicle.vehicle_number,
                "vehicle_type": p.vehicle.vehicle_type,
                "owner_name": p.vehicle.owner_name or p.vehicle.driver_name or "Customer",
                "phone_number": p.whatsapp_number or p.vehicle.phone_number,
                "expiry_date": p.expiry_date,
                "days_remaining": days_left,
                "status": p.status,
                "last_reminder_status": last_reminder.reminder_status if last_reminder else "NONE",
                "last_reminder_type": last_reminder.reminder_type if last_reminder else "NONE",
                "last_reminder_date": last_reminder.sent_date if last_reminder else None
            })
        return Response(data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def send_whatsapp_reminder(self, request, pk=None):
        m_pass = self.get_object()
        from .reminder_service import send_reminder_for_pass
        force = request.data.get("force", True)
        reminder_type = request.data.get("reminder_type", "MANUAL")
        res = send_reminder_for_pass(m_pass, reminder_type=reminder_type, force=force)
        return Response(res, status=status.HTTP_200_OK if res["success"] else status.HTTP_200_OK)

    @action(detail=False, methods=["post"])
    def send_due_reminders(self, request):
        from .reminder_service import send_due_reminders_scan
        res = send_due_reminders_scan()
        return Response(res, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"])
    def reminder_history(self, request):
        reminders = ReminderLog.objects.all().order_by("-id")[:50]
        data = ReminderLogSerializer(reminders, many=True).data
        return Response(data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"])
    def test_whatsapp(self, request):
        from .reminder_service import test_whatsapp_configuration
        res = test_whatsapp_configuration()
        return Response(res, status=status.HTTP_200_OK)

class MonthlyPaymentViewSet(viewsets.ModelViewSet):
    queryset = MonthlyPayment.objects.all().order_by("-id")
    serializer_class = MonthlyPaymentSerializer

class DashboardStatsViewSet(viewsets.ViewSet):
    def list(self, request):
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        today_entries = ParkingSession.objects.filter(entry_time__gte=today_start).count()
        today_exits = ParkingSession.objects.filter(exit_time__gte=today_start, status="released").count()
        currently_parked = ParkingSession.objects.filter(status="parked").count()

        today_casual_rev = ParkingSession.objects.filter(
            exit_time__gte=today_start, status="released"
        ).exclude(payment_method="FREE_MONTHLY").aggregate(sum=Sum("parking_fee"))["sum"] or 0

        today_monthly_rev = MonthlyPayment.objects.filter(
            payment_date=today_start.date(), payment_status="PAID"
        ).aggregate(sum=Sum("amount"))["sum"] or 0

        total_today_revenue = float(today_casual_rev) + float(today_monthly_rev)

        month_start = today_start.date().replace(day=1)
        month_casual_rev = ParkingSession.objects.filter(
            exit_time__gte=month_start, status="released"
        ).exclude(payment_method="FREE_MONTHLY").aggregate(sum=Sum("parking_fee"))["sum"] or 0

        month_monthly_rev = MonthlyPayment.objects.filter(
            payment_date__gte=month_start, payment_status="PAID"
        ).aggregate(sum=Sum("amount"))["sum"] or 0

        month_revenue = float(month_casual_rev) + float(month_monthly_rev)

        cash_rev = ParkingSession.objects.filter(payment_method="Cash", status="released").aggregate(sum=Sum("parking_fee"))["sum"] or 0
        upi_rev = ParkingSession.objects.filter(payment_method="UPI", status="released").aggregate(sum=Sum("parking_fee"))["sum"] or 0

        total_monthly = MonthlyPass.objects.count()
        active_monthly = MonthlyPass.objects.filter(status="ACTIVE").count()
        expired_monthly = MonthlyPass.objects.filter(status="EXPIRED").count()
        pending_payments = MonthlyPayment.objects.filter(payment_status="PENDING").count()
        total_monthly_pass_rev = MonthlyPayment.objects.filter(payment_status="PAID").aggregate(sum=Sum("amount"))["sum"] or 0

        expiry_limit = today_start.date() + datetime.timedelta(days=5)
        expiry_alerts = MonthlyPass.objects.filter(
            expiry_date__lte=expiry_limit,
            expiry_date__gte=today_start.date()
        ).values("id", "vehicle__vehicle_number", "expiry_date", "whatsapp_number")

        return Response({
            "currently_parked": currently_parked,
            "today_entries": today_entries,
            "today_exits": today_exits,
            "today_revenue": total_today_revenue,
            "month_revenue": month_revenue,
            "payment_stats": {
                "cash": float(cash_rev),
                "upi": float(upi_rev)
            },
            "monthly_stats": {
                "total_customers": total_monthly,
                "active_customers": active_monthly,
                "expired_customers": expired_monthly,
                "pending_payments": pending_payments,
                "pass_revenue": float(total_monthly_pass_rev)
            },
            "expiry_alerts": list(expiry_alerts)
        })

class ReportViewSet(viewsets.ViewSet):
    def list(self, request):
        period = request.query_params.get("period", "today")
        custom_start = request.query_params.get("start_date")
        custom_end = request.query_params.get("end_date")

        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = now.replace(hour=23, minute=59, second=59, microsecond=999999)

        if period == "7days":
            filter_start = today_start - datetime.timedelta(days=6)
            filter_end = today_end
        elif period == "month":
            filter_start = today_start.replace(day=1)
            filter_end = today_end
        elif period == "custom" and custom_start:
            try:
                filter_start = datetime.datetime.strptime(custom_start, "%Y-%m-%d")
                filter_start = timezone.make_aware(filter_start) if timezone.is_naive(filter_start) else filter_start
                if custom_end:
                    filter_end = datetime.datetime.strptime(custom_end, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
                    filter_end = timezone.make_aware(filter_end) if timezone.is_naive(filter_end) else filter_end
                else:
                    filter_end = today_end
            except ValueError:
                filter_start = today_start
                filter_end = today_end
        else:
            filter_start = today_start
            filter_end = today_end

        sessions = ParkingSession.objects.filter(entry_time__gte=filter_start, entry_time__lte=filter_end)
        total_entries = sessions.count()
        total_exits = sessions.filter(status="released").count()
        current_parked = ParkingSession.objects.filter(status="parked").count()

        casual_rev = sessions.filter(status="released").exclude(payment_method="FREE_MONTHLY").aggregate(sum=Sum("parking_fee"))["sum"] or 0
        monthly_rev = MonthlyPayment.objects.filter(payment_date__gte=filter_start.date(), payment_date__lte=filter_end.date(), payment_status="PAID").aggregate(sum=Sum("amount"))["sum"] or 0
        total_revenue = float(casual_rev) + float(monthly_rev)

        capacity = 100
        available_spaces = max(0, capacity - current_parked)
        occupancy_percentage = round((current_parked / capacity) * 100, 1)

        cash_count = sessions.filter(payment_method="Cash", status="released").count()
        cash_rev = sessions.filter(payment_method="Cash", status="released").aggregate(sum=Sum("parking_fee"))["sum"] or 0
        upi_count = sessions.filter(payment_method="UPI", status="released").count()
        upi_rev = sessions.filter(payment_method="UPI", status="released").aggregate(sum=Sum("parking_fee"))["sum"] or 0
        monthly_free_count = sessions.filter(payment_method="FREE_MONTHLY").count()

        cars_count = sessions.filter(vehicle__vehicle_type__icontains="Car").count()
        bikes_count = sessions.filter(vehicle__vehicle_type__icontains="Bike").count()
        trucks_count = sessions.filter(Q(vehicle__vehicle_type__icontains="Truck") | Q(vehicle__vehicle_type__icontains="Bus")).count()
        other_count = max(0, total_entries - (cars_count + bikes_count + trucks_count))

        total_monthly_cust = MonthlyPass.objects.count()
        active_monthly = MonthlyPass.objects.filter(status="ACTIVE").count()
        expired_monthly = MonthlyPass.objects.filter(status="EXPIRED").count()
        expiring_soon = MonthlyPass.objects.filter(
            status="ACTIVE",
            expiry_date__lte=today_start.date() + datetime.timedelta(days=7),
            expiry_date__gte=today_start.date()
        ).count()

        active_shift_obj = Shift.objects.filter(status="OPEN").first()
        active_shift = ShiftSerializer(active_shift_obj).data if active_shift_obj else None
        recent_shifts = ShiftSerializer(Shift.objects.all().order_by("-id")[:5], many=True).data

        daily_trends = []
        curr_day = filter_start.date()
        end_day = filter_end.date()
        while curr_day <= end_day and (end_day - curr_day).days < 31:
            d_start = timezone.make_aware(datetime.datetime.combine(curr_day, datetime.time.min))
            d_end = timezone.make_aware(datetime.datetime.combine(curr_day, datetime.time.max))
            
            d_entries = ParkingSession.objects.filter(entry_time__gte=d_start, entry_time__lte=d_end).count()
            d_exits = ParkingSession.objects.filter(exit_time__gte=d_start, exit_time__lte=d_end, status="released").count()
            d_rev = ParkingSession.objects.filter(exit_time__gte=d_start, exit_time__lte=d_end, status="released").exclude(payment_method="FREE_MONTHLY").aggregate(sum=Sum("parking_fee"))["sum"] or 0
            
            daily_trends.append({
                "date": curr_day.strftime("%b %d"),
                "entries": d_entries,
                "exits": d_exits,
                "revenue": float(d_rev)
            })
            curr_day += datetime.timedelta(days=1)

        return Response({
            "period": period,
            "filter_start": filter_start.strftime("%Y-%m-%d"),
            "filter_end": filter_end.strftime("%Y-%m-%d"),
            "summary": {
                "total_entries": total_entries,
                "total_exits": total_exits,
                "current_parked": current_parked,
                "total_revenue": total_revenue
            },
            "utilization": {
                "total_capacity": capacity,
                "current_occupied": current_parked,
                "available_spaces": available_spaces,
                "occupancy_percentage": occupancy_percentage
            },
            "payment_breakdown": {
                "cash": {"count": cash_count, "revenue": float(cash_rev)},
                "upi": {"count": upi_count, "revenue": float(upi_rev)},
                "monthly_free": {"count": monthly_free_count, "revenue": 0.0},
                "monthly_pass_revenue": float(monthly_rev)
            },
            "vehicle_breakdown": {
                "car": cars_count,
                "bike": bikes_count,
                "truck": trucks_count,
                "other": other_count
            },
            "monthly_pass_report": {
                "total_customers": total_monthly_cust,
                "active_passes": active_monthly,
                "expired_passes": expired_monthly,
                "expiring_soon": expiring_soon
            },
            "shift_report": {
                "active_shift": active_shift,
                "recent_shifts": recent_shifts
            },
            "daily_trends": daily_trends
        })

class ShiftViewSet(viewsets.ModelViewSet):
    queryset = Shift.objects.all().order_by("-id")
    serializer_class = ShiftSerializer

    @action(detail=False, methods=["get"])
    def active(self, request):
        open_shift = Shift.objects.filter(status="OPEN").first()
        if open_shift:
            serializer = self.get_serializer(open_shift)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response({"status": "CLOSED", "message": "No active shift"}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"])
    def open_shift(self, request):
        operator_name = request.data.get("operator_name", "").strip()
        if not operator_name:
            return Response({"error": "Operator name is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        Shift.objects.filter(status="OPEN").update(status="CLOSED", end_time=timezone.now())

        new_shift = Shift.objects.create(operator_name=operator_name, status="OPEN")
        serializer = self.get_serializer(new_shift)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def close_shift(self, request, pk=None):
        shift = self.get_object()
        shift.status = "CLOSED"
        shift.end_time = timezone.now()
        
        entries = ParkingSession.objects.filter(entry_time__gte=shift.start_time, entry_time__lte=shift.end_time).count()
        exits = ParkingSession.objects.filter(exit_time__gte=shift.start_time, exit_time__lte=shift.end_time, status="released").count()
        rev = ParkingSession.objects.filter(exit_time__gte=shift.start_time, exit_time__lte=shift.end_time, status="released").exclude(payment_method="FREE_MONTHLY").aggregate(sum=Sum("parking_fee"))["sum"] or 0
        
        shift.total_entries = entries
        shift.total_exits = exits
        shift.total_revenue = rev
        shift.save()
        
        serializer = self.get_serializer(shift)
        return Response(serializer.data, status=status.HTTP_200_OK)
