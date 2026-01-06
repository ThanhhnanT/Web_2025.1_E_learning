
import requests
import os
from dotenv import dotenv_values
from typing import Optional

config = dotenv_values(".env")

def find_course_image(course_title: str, topic: str = None) -> Optional[str]:

    try:
        unsplash_access_key = (
            config.get('UNSPLASH_ACCESS_KEY') or 
            config.get('UNSPLASH_CLIENT_ID') or 
            os.getenv('UNSPLASH_ACCESS_KEY') or 
            os.getenv('UNSPLASH_CLIENT_ID')
        )
        unsplash_secret_key = (
            config.get('UNSPLASH_SECRET_KEY') or 
            config.get('UNSPLASH_CLIENT_SECRET') or 
            os.getenv('UNSPLASH_SECRET_KEY') or 
            os.getenv('UNSPLASH_CLIENT_SECRET')
        )
        
        if unsplash_access_key:
            return _find_image_unsplash(course_title, topic, unsplash_access_key, unsplash_secret_key)
        else:
            # Fallback: Use a placeholder service or generate a themed image URL
            return _get_fallback_image(course_title, topic)
    
    except Exception as e:
        print(f"Error finding course image: {e}")
        return _get_fallback_image(course_title, topic)


def _find_image_unsplash(course_title: str, topic: str, access_key: str, secret_key: str = None) -> Optional[str]:
    """
    Search for image using Unsplash API.
    
    Args:
        course_title: The course title to search for
        topic: Additional topic context (optional)
        access_key: Unsplash Access Key (Client-ID) - required
        secret_key: Unsplash Secret Key (Client-Secret) - optional, only needed for OAuth
    
    Returns:
        URL of the image, or None if not found
    """
    try:
        # Create search query from course title
        search_query = course_title.lower()
        
        # If topic is provided and different, use it as additional context
        if topic and topic.lower() != course_title.lower():
            # Combine both for better results
            search_query = f"{course_title} {topic}".lower()
        
        # Clean up search query (remove special characters, keep only words)
        import re
        search_query = re.sub(r'[^\w\s]', '', search_query)
        search_query = ' '.join(search_query.split()[:5])  # Limit to 5 words
        
        url = "https://api.unsplash.com/search/photos"
        
        # For search photos, only Access Key (Client-ID) is needed
        # Secret Key is only required for OAuth flows and user authentication
        headers = {
            "Authorization": f"Client-ID {access_key}",
            "Accept-Version": "v1"  # Specify API version
        }
        
        params = {
            "query": search_query,
            "per_page": 1,
            "orientation": "landscape",
            "content_filter": "high"
        }
        
        # Note: Secret key is stored but not used for simple search requests
        # It would be needed if we implement OAuth or user-specific features
        if secret_key:
            print(f"📝 Secret key provided (for future OAuth features)")
        
        response = requests.get(url, headers=headers, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("results") and len(data["results"]) > 0:
                # Use 'regular' size for good quality without being too large
                image_url = data["results"][0]["urls"]["regular"]
                print(f"✅ Found image from Unsplash: {image_url}")
                return image_url
        elif response.status_code == 401:
            print(f"⚠️ Unauthorized: Invalid Access Key. Please check your UNSPLASH_ACCESS_KEY")
        elif response.status_code == 403:
            print(f"⚠️ Forbidden: API rate limit exceeded or insufficient permissions")
        else:
            print(f"⚠️ Unsplash API returned status {response.status_code}: {response.text}")
        
        print(f"⚠️ No image found from Unsplash for query: {search_query}")
        return None
    
    except requests.exceptions.Timeout:
        print(f"⚠️ Unsplash API request timed out")
        return None
    except requests.exceptions.RequestException as e:
        print(f"⚠️ Error with Unsplash API request: {e}")
        return None
    except Exception as e:
        print(f"⚠️ Error with Unsplash API: {e}")
        return None


def _get_fallback_image(course_title: str, topic: str = None) -> Optional[str]:
    try:
        # Option 1: Use Picsum Photos (Lorem Picsum) - reliable placeholder service
        # Generate a seed based on course title for consistent images
        import hashlib
        seed_text = course_title.lower()
        if topic:
            seed_text = f"{course_title} {topic}".lower()
        
        # Create a numeric seed from the text
        seed_hash = int(hashlib.md5(seed_text.encode()).hexdigest()[:8], 16)
        seed = seed_hash % 1000  # Limit to 0-999 for Picsum
        
        # Picsum Photos with seed for consistent images per course
        image_url = f"https://picsum.photos/seed/{seed}/800/600"
        
        print(f"📷 Using fallback image URL (Picsum Photos): {image_url}")
        return image_url
    
    except Exception as e:
        print(f"⚠️ Error getting fallback image: {e}")
        # Ultimate fallback: return None to use gradient in frontend
        return None


def find_image_with_llm(course_title: str, topic: str = None, llm=None) -> Optional[str]:
    """
    Alternative: Use LLM to find or suggest image URLs.
    This can be used if we want AI to search the web for images.
    """
    if not llm:
        return find_course_image(course_title, topic)
    
    try:
        prompt = f"""
        Find a relevant image URL for a course about: {course_title}
        Original topic: {topic if topic else course_title}
        
        Provide a direct image URL that would be suitable for a course cover image.
        The image should be:
        - Related to the course topic
        - Professional and educational
        - Landscape orientation (preferred)
        - High quality
        
        If you cannot find a specific URL, suggest keywords that would help find such an image.
        Return only the URL or keywords, nothing else.
        """
        
        # This would require a web search tool in the agent
        # For now, fallback to regular method
        return find_course_image(course_title, topic)
    
    except Exception as e:
        print(f"Error with LLM image search: {e}")
        return find_course_image(course_title, topic)
