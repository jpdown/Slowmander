import os
import sys

if len(sys.argv) < 2:
    print('must provide a name for a file')
else:
    fn = sys.argv[1]
    fp = 'src/modules/{name}.ts'.format(name = fn)
    if os.path.exists(fp):
        print('file already exists')
        sys.exit()
    else:
        # make sure you use the capilization you want when running the script
        with open(fp, 'w') as nf:
            nf.write('import {{ Module }} from "./Module";\n\nexport class {0} extends Module {{\n}}'.format(fn))
        with open('src/modules/index.ts', 'a') as i:
            i.write('export {{ {0} }} from "./{0}"\n'.format(fn))
