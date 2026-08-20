from django.apps import AppConfig

class ComfycuteappConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'ComfyCuteApp'

    def ready(self):
        """
        Import signals when the app is ready.
        This ensures signal handlers are registered when Django starts.
        """
        import ComfyCuteApp.signals  # noqa: F401
