from sqlalchemy.orm import Session
from database import TransmissionLine, TrippingIncident, TowerLocation, State
from datetime import datetime, timedelta

class PowerGridChatbot:
    def __init__(self, db: Session):
        self.db = db
        
    def get_stats(self):
        """Get system statistics"""
        total_lines = self.db.query(TransmissionLine).count()
        total_incidents = self.db.query(TrippingIncident).count()
        total_towers = self.db.query(TowerLocation).count()
        
        thirty_days_ago = datetime.now().date() - timedelta(days=30)
        recent_incidents = self.db.query(TrippingIncident).filter(
            TrippingIncident.fault_date >= thirty_days_ago
        ).count()
        
        return {
            'total_lines': total_lines,
            'total_incidents': total_incidents,
            'total_towers': total_towers,
            'recent_incidents': recent_incidents
        }
    
    def process_query(self, query: str):
        """Process user query and return response"""
        query_lower = query.lower()
        
        # Get stats for context
        stats = self.get_stats()
        
        # Pattern matching for different queries
        if any(word in query_lower for word in ['hello', 'hi', 'hey']):
            return {
                'response': f"Hello! 👋 I'm your PowerGrid T-LAMP AI Assistant. I can help you with information about transmission lines, incidents, and system statistics. How can I assist you today?",
                'type': 'greeting'
            }
        
        elif any(word in query_lower for word in ['how many', 'total', 'count']):
            if 'line' in query_lower:
                return {
                    'response': f"📊 We currently have **{stats['total_lines']} transmission lines** in the system.",
                    'type': 'statistic',
                    'data': {'lines': stats['total_lines']}
                }
            elif 'incident' in query_lower or 'trip' in query_lower:
                return {
                    'response': f"⚡ Total incidents recorded: **{stats['total_incidents']}**\n\nRecent incidents (last 30 days): **{stats['recent_incidents']}**",
                    'type': 'statistic',
                    'data': {
                        'total': stats['total_incidents'],
                        'recent': stats['recent_incidents']
                    }
                }
            elif 'tower' in query_lower:
                return {
                    'response': f"🗼 Total towers in the system: **{stats['total_towers']}**",
                    'type': 'statistic',
                    'data': {'towers': stats['total_towers']}
                }
        
        elif 'recent' in query_lower and 'incident' in query_lower:
            incidents = self.db.query(TrippingIncident).join(TransmissionLine).order_by(
                TrippingIncident.fault_date.desc()
            ).limit(5).all()
            
            response = "📋 **Recent Incidents:**\n\n"
            for i, inc in enumerate(incidents, 1):
                response += f"{i}. {inc.fault_type} on {inc.transmission_line.line_name} ({inc.fault_date})\n"
            
            return {
                'response': response,
                'type': 'list',
                'data': [
                    {
                        'line': inc.transmission_line.line_name,
                        'type': inc.fault_type,
                        'date': str(inc.fault_date)
                    } for inc in incidents
                ]
            }
        
        elif 'high risk' in query_lower or 'risky' in query_lower:
            # Get lines with most incidents
            from sqlalchemy import func
            risky_lines = self.db.query(
                TransmissionLine.line_name,
                func.count(TrippingIncident.id).label('incident_count')
            ).join(TrippingIncident).group_by(
                TransmissionLine.id
            ).order_by(func.count(TrippingIncident.id).desc()).limit(3).all()
            
            response = "⚠️ **High Risk Transmission Lines:**\n\n"
            for i, (line_name, count) in enumerate(risky_lines, 1):
                response += f"{i}. {line_name} - {count} incidents\n"
            
            return {
                'response': response,
                'type': 'analysis',
                'data': [{'line': name, 'incidents': count} for name, count in risky_lines]
            }
        
        elif 'help' in query_lower or 'what can you do' in query_lower:
            return {
                'response': """🤖 **I can help you with:**

1. **Statistics** - Ask about total lines, incidents, towers
2. **Recent Incidents** - Get latest tripping data
3. **Risk Analysis** - Identify high-risk transmission lines
4. **Line Information** - Details about specific transmission lines
5. **Predictions** - AI-powered maintenance predictions

**Try asking:**
- "How many transmission lines do we have?"
- "Show me recent incidents"
- "Which lines are high risk?"
- "Total incidents last month"
""",
                'type': 'help'
            }
        
        else:
            return {
                'response': f"I'm sorry, I didn't quite understand that. Could you try rephrasing? Type 'help' to see what I can do! 🤔",
                'type': 'unknown'
            }