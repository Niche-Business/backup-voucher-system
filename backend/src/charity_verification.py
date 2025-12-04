"""
Charity Commission Verification Service
Verifies UK charity registration numbers against the official Charity Commission database
"""

import requests
from bs4 import BeautifulSoup
import logging

logger = logging.getLogger(__name__)

class CharityVerificationService:
    """Service to verify charity registration numbers with the UK Charity Commission"""
    
    BASE_URL = "https://register-of-charities.charitycommission.gov.uk"
    SEARCH_URL = f"{BASE_URL}/en/charity-search/-/results/page/1/delta/20/keywords/"
    
    @staticmethod
    def verify_charity_number(charity_number):
        """
        Verify a charity registration number against the UK Charity Commission database
        
        Args:
            charity_number (str): The charity registration number to verify
            
        Returns:
            dict: {
                'valid': bool,
                'charity_name': str or None,
                'status': str or None,
                'message': str
            }
        """
        try:
            # Clean the charity number (remove spaces, convert to string)
            charity_number = str(charity_number).strip().replace(" ", "")
            
            if not charity_number:
                return {
                    'valid': False,
                    'charity_name': None,
                    'status': None,
                    'message': 'Charity number is required'
                }
            
            # Make request to Charity Commission search
            search_url = f"{CharityVerificationService.SEARCH_URL}{charity_number}"
            
            logger.info(f"Verifying charity number: {charity_number}")
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            
            response = requests.get(search_url, headers=headers, timeout=10)
            
            if response.status_code != 200:
                logger.error(f"Charity Commission API returned status {response.status_code}")
                return {
                    'valid': False,
                    'charity_name': None,
                    'status': None,
                    'message': 'Unable to verify charity number at this time. Please try again later.'
                }
            
            # Parse the HTML response
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Check if any results were found
            results_text = soup.get_text()
            
            if "0 matches found" in results_text or "No results found" in results_text:
                return {
                    'valid': False,
                    'charity_name': None,
                    'status': None,
                    'message': f'Charity number {charity_number} not found in the UK Charity Commission register'
                }
            
            # Try to extract charity details from the results table
            # Look for the charity number in the results
            charity_rows = soup.find_all('tr')
            
            for row in charity_rows:
                cells = row.find_all('td')
                if len(cells) >= 3:
                    # Check if this row contains our charity number
                    number_cell = cells[0].get_text().strip()
                    
                    if number_cell == charity_number:
                        # Extract charity name and status
                        charity_name_link = cells[1].find('a')
                        charity_name = charity_name_link.get_text().strip() if charity_name_link else cells[1].get_text().strip()
                        
                        status = cells[2].get_text().strip()
                        
                        # Check if charity is registered (not removed)
                        if status.lower() == 'registered':
                            logger.info(f"Charity {charity_number} verified: {charity_name}")
                            return {
                                'valid': True,
                                'charity_name': charity_name,
                                'status': status,
                                'message': f'Charity verified: {charity_name}'
                            }
                        else:
                            logger.warning(f"Charity {charity_number} found but status is: {status}")
                            return {
                                'valid': False,
                                'charity_name': charity_name,
                                'status': status,
                                'message': f'Charity {charity_number} is not currently registered (Status: {status})'
                            }
            
            # If we got results but couldn't parse them, be lenient and allow it
            # (to avoid false negatives due to HTML structure changes)
            if "1 match found" in results_text or "matches found" in results_text:
                logger.warning(f"Charity {charity_number} found but couldn't parse details")
                return {
                    'valid': True,
                    'charity_name': None,
                    'status': 'Found',
                    'message': 'Charity number found in register'
                }
            
            # Default: not found
            return {
                'valid': False,
                'charity_name': None,
                'status': None,
                'message': f'Unable to verify charity number {charity_number}'
            }
            
        except requests.exceptions.Timeout:
            logger.error(f"Timeout verifying charity {charity_number}")
            return {
                'valid': False,
                'charity_name': None,
                'status': None,
                'message': 'Verification service timed out. Please try again.'
            }
        except requests.exceptions.RequestException as e:
            logger.error(f"Error verifying charity {charity_number}: {str(e)}")
            return {
                'valid': False,
                'charity_name': None,
                'status': None,
                'message': 'Unable to connect to verification service. Please try again later.'
            }
        except Exception as e:
            logger.error(f"Unexpected error verifying charity {charity_number}: {str(e)}")
            return {
                'valid': False,
                'charity_name': None,
                'status': None,
                'message': 'An error occurred during verification. Please try again.'
            }


# Convenience function for easy import
def verify_charity_number(charity_number):
    """Verify a charity registration number"""
    return CharityVerificationService.verify_charity_number(charity_number)
