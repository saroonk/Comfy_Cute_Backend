from .models import Announcement


def announcements(request):
    """
    Context processor to make active announcements available to all templates.
    """
    active_announcements = Announcement.objects.filter(is_active=True).order_by('order')
    return {
        'announcements': active_announcements
    }
