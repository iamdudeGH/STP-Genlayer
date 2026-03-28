import json
import pytest

def test_submit_pitch(direct_vm, direct_deploy, direct_alice):
    # Deploy contract
    contract = direct_deploy("contracts/SellMeThisPen.py")
    
    # Act as alice
    direct_vm.sender = direct_alice
    
    # Mock LLM evaluation
    direct_vm.mock_llm(
        r".*",  
        json.dumps({"score": 90, "analysis": "Great pitch!"})
    )
    
    # Submit pitch
    contract.submit_pitch("Buy this pen, it guarantees success.")
    
    # Check leaderboard
    board = contract.get_leaderboard()
    assert board["best_score"] == 90
    assert board["best_pitch"] == "Buy this pen, it guarantees success."
    assert "total_pitches" in board
    assert board["total_pitches"] == 1
    assert board["winner"] == str(direct_alice)
