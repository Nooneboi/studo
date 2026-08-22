import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
PASSAGES=ROOT/'content-src'/'passages'
SETS=ROOT/'content-src'/'sets'
PASSAGES.mkdir(parents=True,exist_ok=True); SETS.mkdir(parents=True,exist_ok=True)

def dump(path,obj):
    path.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

def passage(pid,title,text,context='civics',text_type='informational'):
    obj={
      'schemaVersion':2,'id':pid,'title':title,'text':text.strip(),
      'textType':text_type,'context':context,
      'source':{'type':'original','attribution':'Original content by Studo'},
      'rights':{'status':'original','holder':'Studo','note':'Original practice material created for Studo Arguments & Sources V1.'},
      'status':'published','version':1,'author':'Studo','reviewer':'Arguments & Sources V1 editorial review'
    }
    dump(PASSAGES/f'{pid}.json',obj); return obj

def q(qid,prompt,skill,family,options,correct,why,tip, evidence=None, difficulty='medium',dok=2, seconds=60, secondary=None):
    opts=[]
    for oid,text,dtype,wrong in options:
        o={'id':oid,'text':text}
        if oid!=correct:
            o['distractorType']=dtype
            o['whyWrong']=wrong
        opts.append(o)
    exp={'answer':correct.upper(),'whyCorrect':why,'quickTip':tip}
    if evidence: exp['evidenceRef']=evidence
    return {
      'id':qid,'type':'multiple_choice','prompt':prompt,'primarySkillId':skill,
      **({'secondarySkillIds':secondary} if secondary else {}),
      'familyId':family,'difficulty':difficulty,'dok':dok,
      'difficultyProfile':{'textComplexity':2 if difficulty=='medium' else 3,'reasoningDepth':dok,'evidenceDistance':2 if dok<3 else 3,'distractorSimilarity':2 if difficulty=='medium' else 3,'sourceCount':1,'responseDemand':1},
      'points':1,'estimatedSeconds':seconds,'options':opts,'correct':correct,'explanation':exp
    }

def focused_set(sid,title,description,passage_id,unit_id,domain,primary,secondary,questions,difficulty='medium'):
    obj={
      'schemaVersion':2,'id':sid,'runtime':{'id':sid,'file':f'{sid}.json'},
      'title':title,'description':description,'subject':'rla','category':'arguments','topic':'Arguments & Sources - Focused Practice',
      'difficulty':difficulty,'status':'published','version':1,'passageRefs':[passage_id],
      'author':'Studo','reviewer':'Arguments & Sources V1 editorial review',
      'reviewNotes':'Focused Arguments practice reviewed for one-best-answer logic, evidence fidelity, close distractors, and source-faithful explanations.',
      'questions':questions,
      'curriculum':{'domain':domain,'primarySkillId':primary,'secondarySkillIds':secondary,'unitId':unit_id,'contentKind':'skill_drill','learningObjective':description,'topicLabel':'Focused Practice'}
    }
    dump(SETS/f'{sid}.json',obj); return obj

def mixed_set(sid,title,description,passage_id,primary,secondary,tags,questions,domain='Argument Analysis'):
    obj={
      'schemaVersion':2,'id':sid,'runtime':{'id':sid,'file':f'{sid}.json'},
      'title':title,'description':description,'subject':'rla','category':'arguments','topic':'Arguments & Sources - GED Practice',
      'difficulty':'hard','status':'published','version':1,'passageRefs':[passage_id],
      'author':'Studo','reviewer':'Arguments & Sources V1 editorial review',
      'reviewNotes':'Mixed-source Arguments practice reviewed for source comparison, evidence quality, one-best-answer logic, and ER transfer.',
      'questions':questions,
      'curriculum':{'domain':domain,'primarySkillId':primary,'secondarySkillIds':secondary,'contentKind':'argument_practice','practiceTags':tags,'learningObjective':'Evaluate claims, evidence, reasoning, and multiple sources under GED-style conditions.','topicLabel':'Mixed Source Practice'}
    }
    dump(SETS/f'{sid}.json',obj); return obj
