from django.http import JsonResponse, HttpResponseBadRequest
from datetime import timedelta
from django.utils.timezone import localtime
from django.db.models import Avg
from django.db.models.functions import Cast
from django.db.models import FloatField
from ...models import CpuMonitoring


def cpu_utilization(request, uuid):
    interval = request.GET.get('interval')
    if interval is None:
        return HttpResponseBadRequest("Missing 'interval' parameter")

    try:
        bucket_size_minutes = int(interval)
    except ValueError:
        return HttpResponseBadRequest("'interval' must be an integer")

    now = localtime().replace(second=0, microsecond=0)
    total_buckets = 7
    data = []

    for i in range(total_buckets):
        bucket_end = now - timedelta(minutes=i * bucket_size_minutes)
        bucket_start = bucket_end - timedelta(minutes=bucket_size_minutes)

        avg_data = CpuMonitoring.objects.filter(
            cpu__device__agent__uuid=uuid,
            checkpoint__created_at__gte=bucket_start,
            checkpoint__created_at__lt=bucket_end
        ).annotate(
            cpu_util_as_float=Cast('cpu_utilization', FloatField())
        ).aggregate(
            avg_util=Avg('cpu_util_as_float')
        )

        total_minutes = (i + 1) * bucket_size_minutes
        if total_minutes >= 60: 
            hours = total_minutes / 60
            if hours == int(hours):
                name = f"{int(hours)}hr"
            else:
                name = f"{hours:.1f}hr"
        else:
            name = f"{total_minutes}min"

        avg_value = round(float(avg_data['avg_util'] or 0), 1)

        data.append({
            "name": name,
            "value": avg_value
        })
    data.reverse()

    return JsonResponse(data, safe=False)
