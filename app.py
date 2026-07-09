import xml.etree.ElementTree as ET
import requests
from bs4 import BeautifulSoup
from flask import Flask, jsonify, render_template, request
from datetime import datetime

app = Flask(__name__)

def fetch_and_parse_release_notes():
    url = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=15)
        if response.status_code != 200:
            return []
    except Exception as e:
        print(f"Error fetching feed: {e}")
        return []
        
    try:
        # Parse the XML Atom feed
        root = ET.fromstring(response.content)
        namespace = {'atom': 'http://www.w3.org/2005/Atom'}
        
        updates = []
        
        for entry in root.findall('atom:entry', namespace):
            date_str = entry.find('atom:title', namespace).text
            entry_id = entry.find('atom:id', namespace).text
            
            # Extract anchor from ID if possible (e.g. tag:google.com,2016:bigquery-release-notes#July_08_2026)
            anchor = ""
            if "#" in entry_id:
                anchor = entry_id.split("#")[-1]
            
            link_elem = entry.find('atom:link[@rel="alternate"]', namespace)
            link_url = link_elem.attrib.get('href') if link_elem is not None else "https://cloud.google.com/bigquery/docs/release-notes"
            if anchor and not link_url.endswith(f"#{anchor}"):
                # Ensure anchor is present in the link
                link_url = f"{link_url.split('#')[0]}#{anchor}"
                
            content_elem = entry.find('atom:content', namespace)
            if content_elem is None:
                continue
                
            html_content = content_elem.text
            if not html_content:
                continue
                
            # Parse individual updates from the entry's HTML content
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Google release notes content structure:
            # <h3>Feature/Change/Deprecation</h3>
            # followed by <p>, <ul>, etc. until the next <h3>
            
            current_category = "General"
            current_description_html = []
            
            for child in soup.children:
                if child.name == 'h3':
                    # Save previous update if it exists
                    if current_description_html:
                        content_raw = "".join(current_description_html).strip()
                        soup_inner = BeautifulSoup(content_raw, 'html.parser')
                        text_content = soup_inner.get_text()
                        updates.append({
                            'date': date_str,
                            'category': current_category,
                            'content_html': content_raw,
                            'content_text': text_content,
                            'link': link_url
                        })
                        current_description_html = []
                    current_category = child.get_text()
                elif child.name:
                    current_description_html.append(str(child))
                    
            # Append the last update
            if current_description_html:
                content_raw = "".join(current_description_html).strip()
                soup_inner = BeautifulSoup(content_raw, 'html.parser')
                text_content = soup_inner.get_text()
                updates.append({
                    'date': date_str,
                    'category': current_category,
                    'content_html': content_raw,
                    'content_text': text_content,
                    'link': link_url
                })
                
        return updates
    except Exception as e:
        print(f"Error parsing feed XML: {e}")
        return []

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def get_release_notes():
    notes = fetch_and_parse_release_notes()
    return jsonify({
        'status': 'success',
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'count': len(notes),
        'data': notes
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
