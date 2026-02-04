from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, PasswordResetToken, PendingVerification


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'full_name', 'phone', 'role', 'is_identity_verified', 'is_staff')
    list_filter = ('role', 'is_identity_verified', 'is_staff', 'is_superuser')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('full_name', 'phone', 'role')}),
        ('Identity Verification', {'fields': ('identity_document', 'identity_preview', 'is_identity_verified')}),
    )
    readonly_fields = ('identity_preview',)
    
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
    actions = ['verify_users']
    
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
        count = queryset.update(is_identity_verified=True)
        self.message_user(request, f"{count} users have been successfully verified.")
    verify_users.short_description = 'Verify selected users'


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
