from django.core.management.base import BaseCommand
from django.utils import timezone
from parking_app.models import Customer, MonthlySubscription


class Command(BaseCommand):
    help = 'Create monthly subscription records for active customers for the current month if they do not already exist.'

    def handle(self, *args, **options):
        today = timezone.now().date()
        customers = Customer.objects.filter(is_active=True)
        created_count = 0
        for customer in customers:
            subscription, created = MonthlySubscription.objects.get_or_create(
                customer=customer,
                month=today.month,
                year=today.year,
                defaults={
                    'amount': customer.vehicle_type.minimum_charge if customer.vehicle_type else 0,
                    'payment_status': 'PENDING',
                    'start_date': today,
                    'end_date': today,
                },
            )
            if created:
                created_count += 1
        self.stdout.write(self.style.SUCCESS(f'Created {created_count} monthly subscription records.'))
