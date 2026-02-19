from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, PasswordResetToken, PendingVerification, PlatformPolicy


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'full_name', 'phone', 'role', 'is_identity_verified', 'verification_status', 'is_active', 'is_staff')
    list_filter = ('role', 'is_identity_verified', 'verification_status', 'is_active', 'is_staff', 'is_superuser')
    actions = ['block_users', 'unblock_users']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('full_name', 'phone', 'role')}),
        ('Identity Verification', {'fields': ('identity_document', 'identity_preview', 'is_identity_verified', 'verification_status', 'rejection_reason')}),
    )
    readonly_fields = ('identity_preview',)
    
    def block_users(self, request, queryset):
        count = queryset.update(is_active=False)
        self.message_user(request, f"{count} users have been blocked.")
    block_users.short_description = 'Block selected users'

    def unblock_users(self, request, queryset):
        count = queryset.update(is_active=True)
        self.message_user(request, f"{count} users have been unblocked.")
    unblock_users.short_description = 'Unblock selected users'

    def identity_preview(self, obj):
        if obj.identity_document:
            from django.utils.html import format_html
            return format_html('<img src="{}" style="max-height: 200px;"/>', obj.identity_document.url)
        return "No document uploaded"
    identity_preview.short_description = 'Document Preview'
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Additional Info', {'fields': ('full_name', 'phone', 'role')}),
    )


@admin.register(PendingVerification)
class PendingVerificationAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'full_name', 'role', 'identity_preview_small', 'is_identity_verified')
    list_filter = ('role',)
    readonly_fields = ('identity_preview',)
    actions = ['verify_users', 'reject_users']
    
    def get_queryset(self, request):
        return super().get_queryset(request).filter(is_identity_verified=False)

    def identity_preview_small(self, obj):
        if obj.identity_document:
            from django.utils.html import format_html
            return format_html('<img src="{}" style="max-height: 50px;"/>', obj.identity_document.url)
        return "No document"
    identity_preview_small.short_description = 'ID Preview'

    def identity_preview(self, obj):
        if obj.identity_document:
            from django.utils.html import format_html
            return format_html('<img src="{}" style="max-height: 400px;"/>', obj.identity_document.url)
        return "No document uploaded"
    identity_preview.short_description = 'Document Preview'

    def verify_users(self, request, queryset):
        count = queryset.update(is_identity_verified=True, verification_status='Approved', rejection_reason=None)
        self.message_user(request, f"{count} users have been successfully verified.")
    verify_users.short_description = 'Approve selected verifications'

    def reject_users(self, request, queryset):
        count = queryset.update(is_identity_verified=False, verification_status='Rejected', rejection_reason='Documents do not meet requirements.')
        self.message_user(request, f"{count} verifications have been rejected.")
    reject_users.short_description = 'Reject selected verifications'


@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display = ('user', 'token', 'created_at', 'expires_at', 'used', 'is_valid')
    list_filter = ('used', 'created_at')
    search_fields = ('user__email', 'user__full_name', 'token')
    readonly_fields = ('token', 'created_at')
    
    def is_valid(self, obj):
        return obj.is_valid()
    is_valid.boolean = True
    is_valid.short_description = 'Valid'

@admin.register(PlatformPolicy)
class PlatformPolicyAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_active', 'updated_at')
    list_filter = ('is_active',)
    search_fields = ('title', 'content')
