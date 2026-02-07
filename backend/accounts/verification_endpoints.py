

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_verification(request, user_id):
    """Admin endpoint to approve identity verification."""
    if not request.user.is_staff:
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        user = User.objects.get(id=user_id)
        user.verification_status = 'Approved'
        user.is_identity_verified = True
        user.rejection_reason = None
        user.save()
        
        return Response({
            'message': f'Verification approved for {user.full_name}.',
            'user': {
                'id': user.id,
                'full_name': user.full_name,
                'email': user.email,
                'verification_status': user.verification_status
            }
        })
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_verification(request, user_id):
    """Admin endpoint to reject identity verification."""
    if not request.user.is_staff:
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        user = User.objects.get(id=user_id)
        rejection_reason = request.data.get('rejection_reason', 'Document does not meet verification requirements.')
        
        user.verification_status = 'Rejected'
        user.is_identity_verified = False
        user.rejection_reason = rejection_reason
        user.save()
        
        return Response({
            'message': f'Verification rejected for {user.full_name}.',
            'user': {
                'id': user.id,
                'full_name': user.full_name,
                'email': user.email,
                'verification_status': user.verification_status,
                'rejection_reason': user.rejection_reason
            }
        })
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
