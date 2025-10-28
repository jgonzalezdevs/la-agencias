# Instalación de Dependencias para Exportación

Las funcionalidades de exportación a Excel y PDF requieren las siguientes librerías:

## Opción 1: Con Poetry (Recomendado)
```bash
cd /home/jligo/leandro/backend
poetry install
```

## Opción 2: Con pip en entorno virtual
```bash
cd /home/jligo/leandro/backend

# Si tienes venv
source venv/bin/activate
pip install openpyxl reportlab

# Si no tienes venv, créalo primero
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install openpyxl reportlab
```

## Opción 3: Instalación global (no recomendado para producción)
```bash
pip3 install openpyxl reportlab
# o
python3 -m pip install openpyxl reportlab
```

## Opción 4: Crear requirements.txt temporal
```bash
cd /home/jligo/leandro/backend
pip install openpyxl==3.1.2 reportlab==4.0.0
```

## Verificar instalación
```bash
python3 -c "import openpyxl; import reportlab; print('✅ Librerías instaladas correctamente')"
```

## Si los errores persisten

Si después de instalar las librerías siguen los errores, por favor comparte:
1. El comando exacto que usas para iniciar el backend
2. El mensaje de error completo
3. La versión de Python: `python3 --version`
