from BaseApp.services.imports import requests,Response,Agent,logging,Application,check_password,make_password
from oauth2_provider.models import AccessToken
from django.utils import timezone
import secrets
import os

logger = logging.getLogger("agent_monitoring")

def get_access_token(request):
    """
    Exchange client credentials for an access token using direct database access.
    """
    client_id = request.data.get("client_id")
    client_secret = request.data.get("client_secret")
    agent_uuid = request.headers.get("uuid")

    logger.info("Attempting to get access token for client_id=%s and agent_uuid=%s", client_id, agent_uuid)

    if not all([client_id, client_secret, agent_uuid]):
        logger.warning("Missing credentials in access token request.")
        return Response({"error": "Missing credentials"}, status=400)

    try:
        agent = Agent.objects.get(uuid=agent_uuid)
        app = Application.objects.get(client_id=client_id, agent=agent)
        logger.info("Agent and application successfully retrieved.")
    except Agent.DoesNotExist:
        logger.error("Invalid agent UUID: %s", agent_uuid)
        return Response({"error": "Invalid agent UUID"}, status=404)
    except Application.DoesNotExist:
        logger.error("Invalid application for client_id: %s", client_id)
        return Response({"error": "Invalid application"}, status=403)

    # Verify client_secret if already hashed
    if app.hash_client_secret:
        if not check_password(client_secret, app.client_secret):
            logger.error("Invalid client secret for client_id: %s", client_id)
            return Response({"error": "Invalid client secret"}, status=403)

    try:
        # Generate secure token directly
        token_string = secrets.token_urlsafe(40)
        
        # Create access token directly in database
        access_token = AccessToken.objects.create(
            user=None,  # Client credentials don't have a user
            application=app,
            token=token_string,
            expires=timezone.now() + timezone.timedelta(hours=1),
            scope='read write'
        )
        
        # Hash client secret if not already hashed
        if not app.hash_client_secret:
            app.client_secret = make_password(client_secret)
            app.hash_client_secret = True
            app.save()
        
        logger.info("Access token created successfully via direct database access.")
        
        return Response({
            'access_token': access_token.token,
            'token_type': 'Bearer',
            'expires_in': 3600,
            'scope': 'read write'
        }, status=200)
        
    except Exception as e:
        logger.error(f"Error creating access token: {str(e)}")
        return Response({"error": "Token creation failed"}, status=500)

def get_refreshed_access_token(request):
    """
    Validate and refresh an access token using direct database access.
    """
    client_id = request.data.get("client_id")
    client_secret = request.data.get("client_secret")
    agent_uuid = request.headers.get("uuid")

    logger.info("Attempting to refresh access token for client_id=%s and agent_uuid=%s", client_id, agent_uuid)

    if not all([client_id, client_secret, agent_uuid]):
        logger.warning("Missing credentials in refresh token request.")
        return Response({"error": "Missing credentials"}, status=400)

    try:
        agent = Agent.objects.get(uuid=agent_uuid)
        app = Application.objects.get(client_id=client_id, agent=agent)
        logger.info("Agent and application successfully retrieved.")
        
        if app.hash_client_secret:
            if not check_password(client_secret, app.client_secret):
                logger.error("Invalid client secret for client_id: %s", client_id)
                return Response({"error": "Invalid client secret"}, status=403)
        else:
            app.client_secret = make_password(client_secret)
            app.hash_client_secret = True
            app.save()
            logger.info("Client secret hashed and application updated.")

    except Agent.DoesNotExist:
        logger.error("Invalid agent UUID: %s", agent_uuid)
        return Response({"error": "Invalid agent UUID"}, status=404)
    except Application.DoesNotExist:
        logger.error("Invalid application for client_id: %s", client_id)
        return Response({"error": "Invalid application"}, status=403)

    try:
        # Generate new secure token
        token_string = secrets.token_urlsafe(40)
        
        # Optionally expire existing tokens for this application
        AccessToken.objects.filter(
            application=app, 
            expires__gt=timezone.now()
        ).update(expires=timezone.now())
        
        # Create new access token directly in database
        access_token = AccessToken.objects.create(
            user=None,
            application=app,
            token=token_string,
            expires=timezone.now() + timezone.timedelta(hours=1),
            scope='read write'
        )
        
        logger.info("Refreshed access token created successfully via direct database access.")
        
        return Response({
            'access_token': access_token.token,
            'token_type': 'Bearer',
            'expires_in': 3600,
            'scope': 'read write'
        }, status=200)
        
    except Exception as e:
        logger.error(f"Error creating refreshed access token: {str(e)}")
        return Response({"error": "Token refresh failed"}, status=500)
