import unittest
from pathlib import Path
import xml.etree.ElementTree as ET

class FishingSitemap(unittest.TestCase):
 def test_public_fishing_url(self):
  base=Path(__file__).resolve().parents[1]
  root=ET.parse(base/'sitemap.xml').getroot()
  urls=[el.text for el in root.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
  self.assertIn('https://explore.digiylyfe.com/fiche.html?slug=sortie-peche-jb-baptiste-760a00ad', urls)
  self.assertNotIn('https://explore.digiylyfe.com/fiche.html', urls)
