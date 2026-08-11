from django.db import models


class ContactSubmission(models.Model):
    """
    Model for storing contact form submissions from the Contact Us page.
    """
    SUBJECT_CHOICES = [
        ('order', 'Order Inquiry'),
        ('shipping', 'Shipping & Delivery'),
        ('returns', 'Returns & Exchanges'),
        ('sizing', 'Sizing & Fit'),
        ('product', 'Product Information'),
        ('feedback', 'Feedback'),
        ('other', 'Other'),
    ]

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True, null=True)
    subject = models.CharField(max_length=50, choices=SUBJECT_CHOICES)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Contact Submission'
        verbose_name_plural = 'Contact Submissions'

    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.get_subject_display()}"


class HeroBanner(models.Model):
    """
    Model for managing homepage hero slider banners.
    Each banner contains desktop and mobile images for responsive display.
    """
    desktop_image = models.ImageField(
        upload_to='hero_banners/desktop/',
        help_text='Image displayed on desktop and tablet devices (1920x600px recommended)'
    )
    mobile_image = models.ImageField(
        upload_to='hero_banners/mobile/',
        help_text='Image displayed on mobile devices (540x800px recommended)'
    )
    hero_url = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        help_text='Destination URL when user clicks the hero slide. Leave blank to use Products page.'
    )
    order = models.PositiveIntegerField(
        default=0,
        help_text='Order in which the slide appears. Lower numbers appear first.'
    )
    is_active = models.BooleanField(
        default=True,
        help_text='Enable/disable this slide without deleting it'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']
        verbose_name = 'Hero Banner'
        verbose_name_plural = 'Hero Banners'

    def __str__(self):
        return f"Hero Banner #{self.order}"
