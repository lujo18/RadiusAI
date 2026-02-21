"""
Static heuristic checker: finds function definitions and call sites that pass `user_id`.
Reports calls where the target function's signature does not include a `user_id` parameter.
This is a best-effort tool (regex-based) to surface likely mismatches.
Run from repository root with: python .automation/check_userid_call_mismatches.py
"""
import re
import os

ROOT = os.path.join(os.getcwd())
BACKEND = os.path.join(ROOT, 'backend')

func_def_re = re.compile(r'^def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\):')
call_re_template = r'\b{fname}\s*\(([^)]*)\)'

# gather defs
func_sigs = {}  # name -> param string
for dirpath, dirnames, filenames in os.walk(BACKEND):
    for fn in filenames:
        if not fn.endswith('.py'):
            continue
        path = os.path.join(dirpath, fn)
        try:
            with open(path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
        except Exception:
            continue
        for i, line in enumerate(lines):
            m = func_def_re.match(line.strip())
            if m:
                name = m.group(1)
                params = m.group(2)
                func_sigs[name] = params

# find calls that pass user_id
mismatches = []
call_sites = []
for dirpath, dirnames, filenames in os.walk(BACKEND):
    for fn in filenames:
        if not fn.endswith('.py'):
            continue
        path = os.path.join(dirpath, fn)
        try:
            text = open(path, 'r', encoding='utf-8').read()
        except Exception:
            continue
        for fname, params in func_sigs.items():
            cre = re.compile(call_re_template.format(fname=re.escape(fname)))
            for cm in cre.finditer(text):
                args = cm.group(1)
                if 'user_id' in args or 'user=' in args or 'user_id=' in args:
                    # record site
                    # locate line number
                    start = cm.start()
                    lineno = text.count('\n', 0, start) + 1
                    call_sites.append((path, lineno, fname, args.strip()))
                    # check if def params include user_id
                    params_norm = params.replace(' ', '')
                    has_param = 'user_id' in params_norm or 'user:' in params_norm and 'user_id' in params_norm
                    if not has_param:
                        mismatches.append((path, lineno, fname, args.strip(), params))

# Output
print('Found {} function definitions.'.format(len(func_sigs)))
print('Found {} call sites that pass user_id-like args.'.format(len(call_sites)))
print('Potential mismatches (calls passing user_id where def has no user_id param):')
for p in mismatches:
    path, lineno, fname, args, params = p
    print(f"{path}:{lineno} -> call {fname}({args})  ; def params: ({params})")

if not mismatches:
    print('No likely mismatches detected by heuristic.')
else:
    print('\nReview the above call sites to confirm and fix signatures or calls.')

print('\nCall sites detected passing user_id-like args:')
for cs in call_sites:
    path, lineno, fname, args = cs
    print(f"{path}:{lineno} -> {fname}({args})")
else:
    print('\nReview the above call sites to confirm and fix signatures or calls.')
