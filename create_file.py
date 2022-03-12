import os
import sys

def main():
    if len(sys.argv) < 2:
        print('must provide a name for a file')
    else:
        file_name = sys.argv[1]
        file_path = 'src/modules/{name}.ts'.format(name = file_name)
        if os.path.exists(file_path):
            print('file already exists')
            sys.exit()
        else:
            # make sure you use the capilization you want when running the script
            with open(file_path, 'w') as new_module:
                new_module.write('import {{ Module }} from "./Module";\n\nexport class {0} extends Module {{\n}}\n'.format(file_name))
            with open('src/modules/index.ts', 'a') as index:
                index.write('export {{ {0} }} from "./{0}"\n'.format(file_name))

if __name__ == '__main__':
    main()
