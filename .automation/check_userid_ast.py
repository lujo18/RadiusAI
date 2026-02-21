"""
AST-based analyzer: finds call sites that pass `user_id` (as positional or keyword)
and checks whether a function def with the same simple name in the backend defines
`user_id` in its parameters. Reports likely mismatches.

Limitations: cross-module resolution is best-effort; it matches by function name only
and will not resolve dynamically imported names.
"""
import ast
import os

ROOT = os.path.dirname(os.path.dirname(__file__))
BACKEND = os.path.join(ROOT, 'backend')

func_defs = {}  # name -> set of param names

# collect defs
for dirpath, dirnames, filenames in os.walk(BACKEND):
    for fn in filenames:
        if not fn.endswith('.py'):
            continue
        path = os.path.join(dirpath, fn)
        try:
            with open(path, 'r', encoding='utf-8') as f:
                tree = ast.parse(f.read(), filename=path)
        except Exception:
            continue
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                params = []
                for a in node.args.args:
                    params.append(a.arg)
                # also include kwonly args
                for a in node.args.kwonlyargs:
                    params.append(a.arg)
                func_defs[node.name] = func_defs.get(node.name, set()) | set(params)

# scan calls
mismatches = []
call_sites = []
for dirpath, dirnames, filenames in os.walk(BACKEND):
    for fn in filenames:
        if not fn.endswith('.py'):
            continue
        path = os.path.join(dirpath, fn)
        try:
            with open(path, 'r', encoding='utf-8') as f:
                src = f.read()
                tree = ast.parse(src, filename=path)
        except Exception:
            continue
        for node in ast.walk(tree):
            if isinstance(node, ast.Call):
                # detect if user_id passed as kw or positional Name
                passed_userid = False
                # keywords
                for kw in node.keywords:
                    if kw.arg == 'user_id' or (isinstance(kw.value, ast.Name) and kw.value.id == 'user_id'):
                        passed_userid = True
                # positional args: if any arg is Name 'user_id'
                for a in node.args:
                    if isinstance(a, ast.Name) and a.id == 'user_id':
                        passed_userid = True
                if not passed_userid:
                    continue
                # determine called function simple name
                func = node.func
                func_name = None
                if isinstance(func, ast.Name):
                    func_name = func.id
                elif isinstance(func, ast.Attribute):
                    func_name = func.attr
                else:
                    continue
                # record site
                lineno = getattr(node, 'lineno', '?')
                relpath = os.path.relpath(path, ROOT)
                call_sites.append((relpath, lineno, func_name))
                # check def
                params = func_defs.get(func_name)
                if params is None:
                    # no def found in backend for this simple name
                    continue
                if 'user_id' not in params:
                    mismatches.append((relpath, lineno, func_name, sorted(list(params))))

print(f'Collected {len(func_defs)} function defs in backend (by simple name).')
print(f'Found {len(call_sites)} call sites passing user_id-like arg.')
print('\nPotential mismatches (call passes user_id but function def has no user_id param):')
for p in mismatches:
    path, lineno, fname, params = p
    print(f'{path}:{lineno} -> call {fname}(...user_id...) ; def params: {params}')

if not mismatches:
    print('No likely mismatches detected by AST scan.')
else:
    print('\nPlease review the above call sites and update either the call or the function signature.')
