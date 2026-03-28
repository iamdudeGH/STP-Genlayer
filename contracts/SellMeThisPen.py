# { "Depends": "py-genlayer:test" }

import json
from genlayer import *

ERROR_LLM       = "[LLM_ERROR]"
ERROR_EXPECTED  = "[EXPECTED]"

class SellMeThisPen(gl.Contract):
    owner: Address
    best_pitch: str
    best_score: u256
    winner: Address
    total_pitches: u256
    user_analyses: TreeMap[str, str]
    user_scores: TreeMap[str, u256]
    
    def __init__(self):
        self.owner = gl.message.sender_address
        self.best_pitch = ""
        self.best_score = 0
        self.winner = self.owner
        self.total_pitches = 0

    @gl.public.view
    def get_leaderboard(self) -> dict:
        return {
            "best_pitch": self.best_pitch,
            "best_score": int(self.best_score),
            "winner": str(self.winner),
            "total_pitches": int(self.total_pitches)
        }
    
    @gl.public.view
    def get_my_result(self, user: str) -> dict:
        score = 0
        analysis = ""
        u_key = str(user).lower()
        if u_key in self.user_scores:
            score = int(self.user_scores[u_key])
        if u_key in self.user_analyses:
            analysis = str(self.user_analyses[u_key])
        return {
            "score": score,
            "analysis": analysis
        }

    @gl.public.write
    def submit_pitch(self, pitch: str) -> None:
        def leader_fn():
            prompt = f"""
You are a highly skeptical, ruthless buyer. Somone is trying to sell you a pen.
Evaluate their pitch carefully.
Pitch: "{pitch}"

Provide an analysis of the pitch and a score from 0 to 100 on how likely you are to buy the pen.
Be extremely critical. Only truly masterful sales pitches should score above 80.
Output JSON format exactly like:
{{
    "analysis": "your reasoning here",
    "score": 85
}}
            """
            analysis = gl.nondet.exec_prompt(prompt, response_format="json")
            if not isinstance(analysis, dict):
                raise gl.vm.UserError(f"{ERROR_LLM} Non-dict response: {type(analysis)}")
                
            raw_score = analysis.get("score")
            if raw_score is None:
                raise gl.vm.UserError(f"{ERROR_LLM} Missing 'score'")
                
            try:
                score = max(0, min(100, int(round(float(str(raw_score).strip())))))
            except (ValueError, TypeError):
                raise gl.vm.UserError(f"{ERROR_LLM} Non-numeric score: {raw_score}")
                
            return {"score": score, "analysis": str(analysis.get("analysis", ""))}

        def validator_fn(leaders_res: gl.vm.Result) -> bool:
            leader_msg = leaders_res.message if hasattr(leaders_res, 'message') else ''
            if not isinstance(leaders_res, gl.vm.Return):
                try:
                    leader_fn()
                    return False
                except gl.vm.UserError as e:
                    validator_msg = e.message if hasattr(e, 'message') else str(e)
                    if validator_msg.startswith(ERROR_EXPECTED):
                        return validator_msg == leader_msg
                    return False
                except Exception:
                    return False

            validator_result = leader_fn()
            leader_score = leaders_res.calldata["score"]
            validator_score = validator_result["score"]
            
            # Allow consensus if scores are within 15 points
            diff = abs(leader_score - validator_score)
            if diff > 15:
                return False
                
            return True

        result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        final_score = result["score"]
        
        user_str = str(gl.message.sender_address).lower()
        self.user_analyses[user_str] = str(result.get("analysis", ""))
        self.user_scores[user_str] = final_score
        
        self.total_pitches += 1
        
        if final_score > self.best_score:
            self.best_score = final_score
            self.best_pitch = pitch
            self.winner = gl.message.sender_address
