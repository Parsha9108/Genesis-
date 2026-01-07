from rest_framework.views import APIView
from BaseApp.serializer import IPMonitorSerializer, IPMonitorCSVSerializer
from rest_framework.response import Response
from rest_framework import status
import csv
import io
from BaseApp.models.ipmonitor import IPMonitor,IPMonitorCheckpoint
from django.db import transaction
from django.db.models import Q,Subquery,OuterRef
import ipaddress
import logging
import uuid
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from BaseApp.utils import JWTCookieAuthentication
from django.shortcuts import get_object_or_404
from django.db.models import Prefetch
logger = logging.getLogger('agent_monitoring')

class Pagination(PageNumberPagination):
    page_size = 10  
    page_size_query_param = 'page_size'
    max_page_size = 100
    
class IPMonitorView(APIView):   
    permission_classes = [IsAuthenticated]
    authentication_classes= [JWTCookieAuthentication]
    
    def post(self, request):
        """Handle JSON or CSV upload for IPMonitor entries"""
        content_type = request.content_type
        if 'application/json' in content_type:
            return self._handle_json(request)
        elif 'multipart/form-data' in content_type:
            return self._handle_csv_upload(request)
        else:   
            return Response(
                {"error": "Unsupported Content-Type. Use application/json or multipart/form-data."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
                
    def _handle_json(self, request):
        try:
            serializer = IPMonitorSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(
                    {"message": "IP Monitoring entry created successfully", "data": serializer.data}, 
                    status=status.HTTP_201_CREATED
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"JSON upload error: {e}", exc_info=True)
            return Response(
                {"error": f"Upload failed: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    def _handle_csv_upload(self, request):
        try:               
            serializer = IPMonitorCSVSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            csv_file = serializer.validated_data['csv_file']
            decoded_file = csv_file.read().decode('utf-8')
            io_string = io.StringIO(decoded_file)
            reader = csv.DictReader(io_string)
            instance_tocreate = []
            errors = []
            row_num = 1
            duplicates_in_csv = []
            duplicates_in_db = []
            seen_ips = set()
            
            existing_ips = set(
            IPMonitor.objects.values_list('ip_address', flat=True)
            )
            for row in reader:
                row_num += 1
                try:
                    name = row.get('name', '').strip()
                    ip_address = row.get('ip_address', '').strip()
                    if not name or not ip_address:
                        errors.append(f"Row {row_num}: 'name' and 'ip_address' are required.")
                        continue
                   
                    ipaddress.ip_address(ip_address)
                    
                    if ip_address in seen_ips:
                        duplicates_in_csv.append({
                            'row': row_num,
                            'ip': ip_address,
                            'name': name
                        })
                        continue
                
                    # Check if IP already exists in database
                    if ip_address in existing_ips:
                        duplicates_in_db.append({
                            'row': row_num,
                            'ip': ip_address,
                            'name': name
                        })
                        continue
                    
                    seen_ips.add(ip_address)
                    instance_tocreate.append(IPMonitor(
                        name=name,
                        ip_address=ip_address,
                    ))
                except ValueError as e:
                        errors.append(f"Row {row_num}: Invalid IP address '{ip_address}'")
                except KeyError as e:
                        errors.append(f"Row {row_num}: Missing column {e}") 
                        
            created_count = 0
            if instance_tocreate:
                with transaction.atomic():
                    IPMonitor.objects.bulk_create(instance_tocreate,ignore_conflicts=True, batch_size=1000)
                    created_count = len(instance_tocreate)
                    
            response_data = {
            'message': f'Successfully created {created_count} IP Monitor entries.' if created_count > 0 else 'No new IP Monitor entries were created.',
            'created': created_count,
            'total_rows': row_num - 1,
            'duplicates_in_csv': len(duplicates_in_csv),
            'duplicates_in_database': len(duplicates_in_db),
        
            }
            
            if errors:
                response_data['warning'] = f'{len(errors)} rows had errors'
            if duplicates_in_csv:
                response_data['duplicates_in_csv_details'] = duplicates_in_csv
            if duplicates_in_db:
                response_data['duplicates_in_database_details'] = duplicates_in_db[:20] # Limit to first 20 for brevity
                
            return Response(response_data, status=status.HTTP_201_CREATED)
        
        except UnicodeDecodeError:
            return Response(
                {"error": "Invalid file format. Please upload a valid CSV file."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"CSV upload error: {e}", exc_info=True)
            return Response(
                {"error": f"Upload failed: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
                    
    def get(self, request):
        try:
          # Get latest checkpoint for each IP monitor using subquery
            latest_checkpoint = IPMonitorCheckpoint.objects.filter(
                ip_monitor=OuterRef('pk')
            ).order_by('-created_at')
            
            # Annotate IP monitors with latest checkpoint data
            ip_monitors = IPMonitor.objects.annotate(
            status=Subquery(latest_checkpoint.values('status')[:1]),
            min_latency=Subquery(latest_checkpoint.values('min_latency')[:1]),
            max_latency=Subquery(latest_checkpoint.values('max_latency')[:1]),
            jitter=Subquery(latest_checkpoint.values('jitter')[:1]),
            created_at=Subquery(latest_checkpoint.values('created_at')[:1])
            ).all()
            
            search_query=request.query_params.get('search','')
            if search_query:
                ip_monitors=ip_monitors.filter(
                Q(status__icontains=search_query) |
                Q(ip_address__icontains=search_query) |
                Q(name__icontains=search_query)
                ).distinct()
                
            pageinator=Pagination()
            page=pageinator.paginate_queryset(ip_monitors, request)
            serializer = IPMonitorSerializer(page, many=True)
            return pageinator.get_paginated_response(serializer.data)
        except Exception as e:
            logger.error(f"Error fetching IP Monitor entries: {e}", exc_info=True)
            return Response(
                {"error": f"Failed to retrieve entries: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    def patch(self, request):
        try:
            uuid=request.data.get('uuid')
            ipmonitor=get_object_or_404(IPMonitor, uuid=uuid)
            logger.info(f"Updating IP Monitor entry with UUID: {uuid}")
            logger.info(f"IP Monitor update data: {request.data}") 
            serializer = IPMonitorSerializer(ipmonitor, data=request.data, partial=True)
            
            if serializer.is_valid():
                serializer.save()
                return Response(
                    {"message": "IP Monitor entry updated successfully", "data": serializer.data}, 
                    status=status.HTTP_200_OK
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error updating IP Monitor entry: {e}", exc_info=True)
            return Response(
                {"error": f"Update failed: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    def delete(self, request):
        try:
            requested_uuid = request.data.get('uuid', None)
            if not requested_uuid:
                return Response(
                     {"error": "UUID is required for deletion."}, 
                     status=status.HTTP_400_BAD_REQUEST
                )
            if isinstance(requested_uuid, str):
                requested_uuid = [requested_uuid]
            else:
                requested_uuid = list(requested_uuid)
                
            valid_uuids = []
            for uid in requested_uuid:
                try:
                    valid_uuids.append(uuid.UUID(str(uid)))
                except (ValueError, TypeError):
                    logger.warning(f"Invalid UUID skipped: {uid}")
            if not valid_uuids:
                return Response(
                    {"error": "No valid UUIDs provided for deletion."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            ips=IPMonitor.objects.filter(uuid__in=valid_uuids)
            if not ips.exists():
                return Response(
                    {"error": "No IP Monitor entries found for the provided UUIDs."}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            count=ips.count()
            ips.delete()
            return Response(
                {"message": f"Successfully deleted {count} IP Monitor entries."}, 
                status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"Error deleting IP Monitor entries: {e}", exc_info=True)
            return Response(
                {"error": f"Deletion failed: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
        