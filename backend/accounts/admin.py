from django.contrib import admin, messages
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.urls import path
from django.shortcuts import render, redirect
from django.contrib.auth.forms import PasswordChangeForm
from .models import User, PasswordResetToken, PendingVerification


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('user_info', 'user_role', 'user_status', 'date_joined', 'verification_actions')
    list_display_links = None
    list_filter = ('role', 'is_active', 'is_identity_verified', 'verification_status', 'is_staff')
    search_fields = ('username', 'full_name', 'email', 'phone')
    ordering = ('-date_joined',)
    actions = None
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('full_name', 'phone', 'role', 'address', 'profile_photo')}),
        ('Identity Verification', {'fields': ('identity_document', 'identity_preview', 'is_identity_verified', 'verification_status')}),
    )
    readonly_fields = ('identity_preview', 'identity_preview_small')

    def user_info(self, obj):
        photo_url = obj.profile_photo.url if obj.profile_photo else None
        initial = obj.full_name[0].upper() if obj.full_name else obj.username[0].upper()
        
        if photo_url:
            avatar = f'<img src="{photo_url}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;"/>'
        else:
            avatar = f'<div style="width: 40px; height: 40px; border-radius: 50%; background: #F1F5F9; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #64748B;">{initial}</div>'
            
        return format_html(
            '<div style="display: flex; align-items: center; gap: 16px; min-width: 250px;">'
            '    {}'
            '    <div style="display: flex; flex-direction: column; flex: 1;">'
            '        <div style="font-weight: 800; color: #0F172A; font-size: 14.5px; letter-spacing: -0.01em;">{}</div>'
            '        <div style="color: #64748B; font-size: 12.5px; font-weight: 500;">{}</div>'
            '    </div>'
            '</div>',
            format_html(avatar),
            obj.full_name or obj.username,
            obj.email
        )
    user_info.short_description = 'User Identification'

    def user_role(self, obj):
        role_colors = {
            'Owner': {'bg': '#F5F3FF', 'text': '#7C3AED', 'border': '#DDD6FE'},
            'Tenant': {'bg': '#EFF6FF', 'text': '#2563EB', 'border': '#BFDBFE'},
            'Admin': {'bg': '#F1F5F9', 'text': '#475569', 'border': '#E2E8F0'},
        }
        color = role_colors.get(obj.role, role_colors['Admin'])
        return format_html(
            '<span style="background: {}; color: {}; border: 1px solid {}; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; text-transform: uppercase;">{}</span>',
            color['bg'], color['text'], color['border'], obj.role
        )
    user_role.short_description = 'Role'

    def user_status(self, obj):
        if obj.is_active:
            return format_html('<span style="background: #ECFDF5; color: #10B981; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 800;">ACTIVE</span>')
        return format_html('<span style="background: #FEF2F2; color: #EF4444; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 800;">INACTIVE</span>')
    user_status.short_description = 'Status'

    def verification_actions(self, obj):
        from django.urls import reverse
        detail_url = reverse('admin:user_detail', args=[obj.pk])
        html = f'<a href="{detail_url}" style="background:#2563EB;color:white;padding:5px 12px;border-radius:6px;font-size:12px;font-weight:700;text-decoration:none;margin-right:4px;">View</a>'
        if obj.identity_document and obj.verification_status == 'Pending':
            kyc_url = reverse('admin:user_kyc_review', args=[obj.pk])
            html += f'<a href="{kyc_url}" style="background:#F59E0B;color:white;padding:5px 12px;border-radius:6px;font-size:12px;font-weight:700;text-decoration:none;">Review KYC</a>'
        return format_html(html)
    verification_actions.short_description = 'Actions'
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('profile/', self.admin_site.admin_view(self.profile_view), name='user_profile'),
            path('<int:user_id>/detail/', self.admin_site.admin_view(self.user_detail_view), name='user_detail'),
            path('<int:user_id>/kyc/', self.admin_site.admin_view(self.kyc_review_view), name='user_kyc_review'),
            path('<int:user_id>/toggle-active/', self.admin_site.admin_view(self.toggle_active_view), name='user_toggle_active'),
        ]
        return custom_urls + urls

    def profile_view(self, request):
        if request.method == 'POST':
            user = request.user
            user.full_name = request.POST.get('full_name', user.full_name)
            user.email = request.POST.get('email', user.email)
            user.phone = request.POST.get('phone', user.phone)
            user.address = request.POST.get('address', user.address)
            
            if 'profile_photo' in request.FILES:
                user.profile_photo = request.FILES['profile_photo']
                
            user.save()
            messages.success(request, "Profile updated successfully.")
            return redirect('admin:user_profile')

        context = {
            **self.admin_site.each_context(request),
            'title': 'Your Profile',
            'user_obj': request.user,
        }
        return render(request, 'admin/accounts/profile.html', context)

    def user_detail_view(self, request, user_id):
        from django.shortcuts import get_object_or_404
        u = get_object_or_404(User, pk=user_id)
        context = {
            **self.admin_site.each_context(request),
            'title': f'{u.full_name or u.email} — User Profile',
            'user_obj': u,
            'opts': self.model._meta,
        }
        return render(request, 'admin/accounts/user/user_detail.html', context)

    def kyc_review_view(self, request, user_id):
        from django.shortcuts import get_object_or_404
        from django.http import HttpResponseRedirect
        from django.urls import reverse
        u = get_object_or_404(User, pk=user_id)
        if request.method == 'POST':
            action = request.POST.get('action')
            if action == 'approve':
                u.is_identity_verified = True
                u.verification_status = 'Verified'
                u.save()
                messages.success(request, f"{u.full_name or u.email}'s identity has been approved.")
            elif action == 'reject':
                u.is_identity_verified = False
                u.verification_status = 'Rejected'
                u.save()
                messages.warning(request, f"{u.full_name or u.email}'s identity has been rejected.")
            return HttpResponseRedirect(reverse('admin:accounts_user_changelist'))
        context = {
            **self.admin_site.each_context(request),
            'title': f'KYC Review — {u.full_name or u.email}',
            'user_obj': u,
            'opts': self.model._meta,
        }
        return render(request, 'admin/accounts/user/kyc_review.html', context)

    def toggle_active_view(self, request, user_id):
        from django.shortcuts import get_object_or_404
        from django.http import HttpResponseRedirect
        from django.urls import reverse
        u = get_object_or_404(User, pk=user_id)
        if u.pk != request.user.pk:
            u.is_active = not u.is_active
            u.save()
            status = 'activated' if u.is_active else 'deactivated'
            messages.success(request, f"{u.full_name or u.email}'s account has been {status}.")
        return HttpResponseRedirect(reverse('admin:user_detail', args=[user_id]))

    def identity_preview(self, obj):
        if obj.identity_document:
            return format_html('<img src="{}" style="max-height: 200px;"/>', obj.identity_document.url)
        return "No document uploaded"
    identity_preview.short_description = 'Document Preview'

    def identity_preview_small(self, obj):
        if obj.identity_document:
            return format_html('<img src="{}" style="max-height: 40px; border-radius: 6px;"/>', obj.identity_document.url)
        return "No photo"
    identity_preview_small.short_description = 'ID'
    
    def changelist_view(self, request, extra_context=None):
        action = request.GET.get('action')
        ids = request.GET.get('ids')
        if action and ids:
            queryset = User.objects.filter(pk__in=ids.split(','))
            from django.urls import reverse
            if action == 'approve_id':
                queryset.update(is_identity_verified=True, verification_status='Approved')
                self.message_user(request, "User(s) identity verified.")
            elif action == 'reject_id':
                queryset.update(is_identity_verified=False, verification_status='Rejected')
                self.message_user(request, "User(s) identity rejected.")
            
            from django.http import HttpResponseRedirect
            return HttpResponseRedirect(reverse('admin:accounts_user_changelist'))
            
        extra_context = extra_context or {}
        extra_context['title'] = 'Manage Users'
        extra_context['title_description'] = 'View and manage all user accounts'
        return super().changelist_view(request, extra_context)


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
