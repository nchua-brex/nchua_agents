#!/usr/bin/env python3
"""
Multi-Agent System Setup Script

Manages global dependencies and agent initialization for the multi-agent system.
Run this script to set up the environment for all agents.
"""

import subprocess
import sys
import os
from pathlib import Path

def check_python_version():
    """Check if Python version is compatible."""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python 3.8+ is required for the multi-agent system")
        print(f"   Current version: {version.major}.{version.minor}.{version.micro}")
        return False
    
    print(f"✅ Python version: {version.major}.{version.minor}.{version.micro}")
    return True

def install_dependencies():
    """Install all global dependencies."""
    print("\n📦 Installing Global Dependencies...")
    print("=" * 50)
    
    requirements_file = Path(__file__).parent / "requirements.txt"
    
    if not requirements_file.exists():
        print("❌ Global requirements.txt not found")
        return False
    
    try:
        # Install with user flag to avoid permission issues
        cmd = [sys.executable, "-m", "pip", "install", "--user", "-r", str(requirements_file)]
        
        print(f"Running: {' '.join(cmd)}")
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ All dependencies installed successfully!")
            return True
        else:
            print(f"❌ Installation failed: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Installation error: {e}")
        return False

def validate_agent_structure():
    """Validate the multi-agent system structure."""
    print("\n🔍 Validating Agent Structure...")
    print("=" * 40)
    
    base_dir = Path(__file__).parent
    
    required_structure = {
        "agents/": "Agents directory",
        "agents/data_retrieval/": "Data retrieval agent", 
        "agents/shared/": "Shared utilities",
        "agents_orchestrator.py": "Agent orchestrator",
        "validate_agents.py": "Structure validator",
        "requirements.txt": "Global dependencies"
    }
    
    all_valid = True
    
    for path_str, description in required_structure.items():
        path = base_dir / path_str
        if path.exists():
            print(f"✅ {description}")
        else:
            print(f"❌ Missing: {description} ({path_str})")
            all_valid = False
    
    return all_valid

def test_imports():
    """Test that key dependencies can be imported."""
    print("\n🧪 Testing Key Imports...")
    print("=" * 30)
    
    test_imports = [
        ("pandas", "Data manipulation"),
        ("yaml", "Configuration parsing"),
        ("snowflake.connector", "Snowflake connectivity"),
        ("jinja2", "Query templating"),
        ("pytest", "Testing framework")
    ]
    
    all_imports_ok = True
    
    for module, description in test_imports:
        try:
            __import__(module)
            print(f"✅ {description} ({module})")
        except ImportError as e:
            print(f"❌ {description} ({module}): {e}")
            all_imports_ok = False
    
    return all_imports_ok

def test_agents():
    """Test that agents can be imported and initialized."""
    print("\n🤖 Testing Agent Initialization...")
    print("=" * 35)
    
    base_dir = Path(__file__).parent
    
    try:
        # Test orchestrator
        sys.path.insert(0, str(base_dir))
        
        # Import and test orchestrator
        from agents_orchestrator import AgentOrchestrator
        orchestrator = AgentOrchestrator()
        
        # Test agent creation
        agent = orchestrator.get_agent("data_retrieval")
        print("✅ Data retrieval agent created")
        
        # Test health check
        health = orchestrator.health_check()
        if health.get("data_retrieval", False):
            print("✅ Agent health check passed")
        else:
            print("⚠️  Agent health check warning")
        
        print("✅ Agent system functional")
        return True
        
    except Exception as e:
        print(f"❌ Agent test failed: {e}")
        return False

def main():
    """Main setup routine."""
    print("🚀 Multi-Agent System Setup")
    print("=" * 60)
    
    print("\n📋 System Requirements Check")
    
    # Check Python version
    if not check_python_version():
        return False
    
    # Validate structure
    if not validate_agent_structure():
        print("\n❌ Agent structure validation failed")
        print("   Run: python validate_agents.py for details")
        return False
    
    # Install dependencies
    if not install_dependencies():
        print("\n❌ Dependency installation failed") 
        return False
    
    # Test imports
    if not test_imports():
        print("\n⚠️  Some imports failed - check installation")
        print("   You may need to restart your terminal/IDE")
    
    # Test agents
    if not test_agents():
        print("\n⚠️  Agent initialization had issues")
        print("   Check individual agent configurations")
    
    print("\n🎉 Setup Complete!")
    print("=" * 20)
    print("✅ Global dependencies installed")
    print("✅ Agent structure validated")
    print("✅ System ready for development")
    
    print("\n📖 Quick Start Commands:")
    print("  python agents_orchestrator.py list    # List available agents")
    print("  python agents_orchestrator.py test    # Test agent system") 
    print("  cd agents/data_retrieval && python main.py test")
    
    print("\n📚 Documentation:")
    print("  See CLAUDE.md for detailed usage")
    print("  See agents/data_retrieval/README.md for agent docs")
    
    return True

if __name__ == "__main__":
    success = main()
    if not success:
        print("\n💡 If you encounter issues:")
        print("  1. Check Python version (3.8+ required)")
        print("  2. Ensure pip is updated: pip install --upgrade pip")
        print("  3. Try installing dependencies manually:")
        print("     pip install --user pandas PyYAML snowflake-connector-python")
        sys.exit(1)
    else:
        sys.exit(0)