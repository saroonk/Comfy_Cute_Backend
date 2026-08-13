from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth.models import AbstractUser, UserManager


class CustomUserManager(UserManager):
    """Custom manager for User model that handles email-based superuser creation."""

    def create_user(self, email, password=None, **extra_fields):
        """Create and save a user with email-based username."""
        if not email:
            raise ValueError('The Email field must be set')

        # Use email as username, will be stored in the username field
        user = self.model(username=email, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra_fields):
        """Create a superuser with email as the main identifier."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """
    Simple custom User model extending Django's AbstractUser.
    Uses email as the login identifier while keeping the username field.
    """
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255, blank=False)
    phone_number = models.CharField(max_length=20, blank=True, null=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    objects = CustomUserManager()

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return self.email

    def save(self, *args, **kwargs):
        """Automatically set username to email if not already set."""
        if not self.username:
            self.username = self.email
        super().save(*args, **kwargs)


class Announcement(models.Model):
    """
    Model for managing dynamic announcement bar content.
    Announcements are displayed in the top announcement bar in order.
    """
    content = models.CharField(
        max_length=255,
        help_text='Announcement text to display in the announcement bar'
    )
    icon = models.CharField(
        max_length=100,
        blank=True,
        default='fa-solid fa-bell',
        help_text='FontAwesome icon class (e.g., "fa-solid fa-truck-fast", leave blank for no icon)'
    )
    order = models.PositiveIntegerField(
        default=0,
        help_text='Display order - lower numbers appear first'
    )
    is_active = models.BooleanField(
        default=True,
        help_text='Enable/disable announcement without deleting it'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']
        verbose_name = 'Announcement'
        verbose_name_plural = 'Announcements'

    def __str__(self):
        return f"{self.content[:50]}... (Order: {self.order})"


class Testimonial(models.Model):
    """
    Model for storing customer testimonials/reviews.
    Only active testimonials are displayed on the homepage.
    """
    name = models.CharField(max_length=100)
    profile_image = models.ImageField(
        upload_to='testimonials/profiles/',
        blank=True,
        null=True,
        help_text='Optional customer profile image. Leave blank to show first letter avatar.'
    )
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text='Rating from 1 to 5 stars'
    )
    content = models.TextField(
        help_text='Customer review/testimonial text'
    )
    is_active = models.BooleanField(
        default=True,
        help_text='Only active testimonials appear on the homepage'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Testimonial'
        verbose_name_plural = 'Testimonials'

    def __str__(self):
        return f"{self.name} - {self.rating}★"

    def get_first_initial(self):
        """Get first letter of customer name for avatar fallback."""
        return self.name[0].upper() if self.name else "?"

    def clean(self):
        """Validate testimonial data."""
        from django.core.exceptions import ValidationError
        if self.rating < 1 or self.rating > 5:
            raise ValidationError({'rating': 'Rating must be between 1 and 5 stars.'})


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
