import sys, os, importlib
print('CWD=', os.getcwd())
print('PYTHONPATH=', os.environ.get('PYTHONPATH'))
print('sys.path:')
for p in sys.path:
    print(p)
print('\nbackend exists:', os.path.isdir(os.path.join(os.getcwd(), 'backend')))
try:
    import backend
    print('import backend OK, backend.__file__=', backend.__file__)
except Exception as e:
    print('import backend failed:', type(e).__name__, e)
try:
    import app
    print('import app OK, app.__file__=', app.__file__)
except Exception as e:
    print('import app failed:', type(e).__name__, e)
