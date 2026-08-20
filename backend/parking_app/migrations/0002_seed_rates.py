from django.db import migrations

def seed_default_rates(apps, schema_editor):
    VehicleRate = apps.get_model('parking_app', 'VehicleRate')
    default_rates = [
        {'vehicle_type': 'BIKE', 'minimum_charge': 10.00, 'hourly_rate': 5.00, 'is_active': True},
        {'vehicle_type': 'SCOOTER', 'minimum_charge': 15.00, 'hourly_rate': 5.00, 'is_active': True},
        {'vehicle_type': 'CAR', 'minimum_charge': 30.00, 'hourly_rate': 10.00, 'is_active': True},
        {'vehicle_type': 'AUTO', 'minimum_charge': 20.00, 'hourly_rate': 8.00, 'is_active': True},
    ]
    for rate in default_rates:
        VehicleRate.objects.get_or_create(
            vehicle_type=rate['vehicle_type'],
            defaults={
                'minimum_charge': rate['minimum_charge'],
                'hourly_rate': rate['hourly_rate'],
                'is_active': rate['is_active']
            }
        )

def remove_default_rates(apps, schema_editor):
    VehicleRate = apps.get_model('parking_app', 'VehicleRate')
    VehicleRate.objects.filter(vehicle_type__in=['BIKE', 'SCOOTER', 'CAR', 'AUTO']).delete()

class Migration(migrations.Migration):

    dependencies = [
        ('parking_app', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_default_rates, remove_default_rates),
    ]
