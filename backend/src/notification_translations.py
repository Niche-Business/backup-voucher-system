"""
Notification Translations for BAK UP E-Voucher System
Supports: English, Arabic, Romanian, Polish
"""

NOTIFICATION_TRANSLATIONS = {
    'new_free_item': {
        'en': 'New free item available for collection: {item_name} at {shop_name}',
        'ar': 'عنصر مجاني جديد متاح للتحصيل: {item_name} في {shop_name}',
        'ro': 'Articol gratuit nou disponibil pentru colectare: {item_name} la {shop_name}',
        'pl': 'Nowy darmowy artykuł dostępny do odbioru: {item_name} w {shop_name}'
    },
    'new_discounted_item': {
        'en': 'New discounted item available: {item_name} at {shop_name}',
        'ar': 'عنصر مخفض جديد متاح: {item_name} في {shop_name}',
        'ro': 'Articol nou redus disponibil: {item_name} la {shop_name}',
        'pl': 'Nowy przeceniony artykuł dostępny: {item_name} w {shop_name}'
    }
}

def get_notification_message(message_key, language='en', **kwargs):
    """
    Get translated notification message
    
    Args:
        message_key: Key for the message type (e.g., 'new_free_item')
        language: Language code ('en', 'ar', 'ro', 'pl')
        **kwargs: Variables to format into the message (e.g., item_name, shop_name)
    
    Returns:
        Translated and formatted message string
    """
    # Default to English if language not supported
    if language not in ['en', 'ar', 'ro', 'pl']:
        language = 'en'
    
    # Get translation
    translations = NOTIFICATION_TRANSLATIONS.get(message_key, {})
    message_template = translations.get(language, translations.get('en', ''))
    
    # Format with variables
    try:
        return message_template.format(**kwargs)
    except KeyError:
        # If formatting fails, return template as-is
        return message_template
