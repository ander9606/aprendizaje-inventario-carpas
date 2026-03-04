"""
Genera un archivo Excel con las 10 bitácoras de trabajo de grado,
leyendo directamente los archivos Markdown y preservando el formato original.
"""
import re
import os
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, Border, Side, PatternFill
from openpyxl.utils import get_column_letter

BITACORAS_DIR = os.path.dirname(os.path.abspath(__file__))


def parse_markdown(filepath):
    """Parse a bitácora markdown file into structured sections."""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    sections = {}

    # Title
    title_match = re.search(r"^# (.+)$", content, re.MULTILINE)
    sections["title"] = title_match.group(1) if title_match else ""

    # Info table
    info_rows = []
    table_pattern = re.findall(r"\| \*\*(.+?)\*\* \| (.+?) \|", content)
    for campo, detalle in table_pattern:
        # Skip the metrics table (bitácora 10)
        if campo in ("Archivos JS/JSX", "Endpoints API", "Componentes React",
                      "Hooks personalizados", "Tablas de base de datos",
                      "Migraciones SQL", "Commits totales", "Pull Requests"):
            continue
        info_rows.append((campo, detalle))
    sections["info"] = info_rows

    # Split by ## headings
    heading_pattern = re.compile(r"^## (.+)$", re.MULTILINE)
    headings = list(heading_pattern.finditer(content))

    for i, match in enumerate(headings):
        heading = match.group(1).strip()
        start = match.end()
        end = headings[i + 1].start() if i + 1 < len(headings) else len(content)
        body = content[start:end].strip()
        # Remove trailing ---
        body = re.sub(r"\n---\s*$", "", body).strip()
        sections[heading] = body

    return sections


def write_rich_text_lines(ws, row, lines, col_start="A", col_end="B"):
    """Write lines preserving structure with proper formatting."""
    bold_font = Font(name="Calibri", bold=True, size=11)
    normal_font = Font(name="Calibri", size=11)
    thin_border = Border(
        left=Side(style="thin"), right=Side(style="thin"),
        top=Side(style="thin"), bottom=Side(style="thin"),
    )
    wrap = Alignment(wrap_text=True, vertical="top")

    for line in lines:
        ws.merge_cells(f"{col_start}{row}:{col_end}{row}")
        cell = ws[f"{col_start}{row}"]
        # Clean markdown bold markers for display
        display = line.replace("**", "")
        cell.value = display
        cell.font = normal_font
        cell.alignment = wrap
        cell.border = thin_border
        ws[f"{col_end}{row}"].border = thin_border
        # Estimate row height
        ws.row_dimensions[row].height = max(20, (len(display) // 90 + 1) * 16)
        row += 1
    return row


def body_to_lines(body):
    """Convert a markdown section body to a list of display lines,
    preserving numbered items, sub-bullets, and plain text."""
    lines = []
    raw_lines = body.split("\n")
    current_item = None

    for raw in raw_lines:
        stripped = raw.strip()
        if not stripped:
            if current_item is not None:
                lines.append(current_item)
                current_item = None
            continue

        # Numbered item: "1. **Title**: ..."
        num_match = re.match(r"^(\d+)\.\s+(.+)$", stripped)
        # Sub-bullet: "   - something"
        sub_match = re.match(r"^\s*-\s+(.+)$", raw)
        # Top-level bullet: "- something"
        bullet_match = re.match(r"^-\s+(.+)$", stripped)

        if num_match and not raw.startswith("   "):
            # Save previous item
            if current_item is not None:
                lines.append(current_item)
            current_item = f"{num_match.group(1)}. {num_match.group(2)}"
        elif sub_match and current_item is not None:
            # Sub-bullet under a numbered item
            current_item += f"\n   - {sub_match.group(1)}"
        elif bullet_match and current_item is None:
            # Top-level bullet (results, difficulties, plan)
            lines.append(f"- {bullet_match.group(1)}")
        elif sub_match and current_item is None:
            # Sub-bullet at top level (e.g. bitácora 10 results)
            if lines:
                lines[-1] += f"\n  {stripped}"
            else:
                lines.append(f"  {stripped}")
        else:
            # Plain text paragraph
            if current_item is not None:
                current_item += " " + stripped
            else:
                lines.append(stripped)

    if current_item is not None:
        lines.append(current_item)

    return lines


def create_excel():
    wb = Workbook()

    # Styles
    header_font = Font(name="Calibri", bold=True, size=11, color="FFFFFF")
    header_fill = PatternFill(start_color="2F5496", end_color="2F5496", fill_type="solid")
    title_font = Font(name="Calibri", bold=True, size=14, color="2F5496")
    info_label_font = Font(name="Calibri", bold=True, size=11)
    normal_font = Font(name="Calibri", size=11)
    thin_border = Border(
        left=Side(style="thin"), right=Side(style="thin"),
        top=Side(style="thin"), bottom=Side(style="thin"),
    )
    wrap = Alignment(wrap_text=True, vertical="top")
    center = Alignment(horizontal="center", vertical="center", wrap_text=True)

    # Ordered section mapping: markdown heading -> Excel section title
    standard_sections = [
        ("Objetivo del Periodo", "OBJETIVO DEL PERIODO"),
        ("Actividades Realizadas", "ACTIVIDADES REALIZADAS"),
        ("Resultados y Avances", "RESULTADOS Y AVANCES"),
        ("Dificultades Encontradas", "DIFICULTADES ENCONTRADAS"),
        ("Plan para el Siguiente Periodo", "PLAN PARA EL SIGUIENTE PERIODO"),
    ]

    # Extra sections only in bitácora 10
    extra_sections = [
        ("Resumen del Estado del Proyecto", "RESUMEN DEL ESTADO DEL PROYECTO"),
        ("Conclusiones Generales", "CONCLUSIONES GENERALES"),
        ("Plan Futuro", "PLAN FUTURO"),
    ]

    for num in range(1, 11):
        filepath = os.path.join(BITACORAS_DIR, f"bitacora-{num:02d}.md")
        sections = parse_markdown(filepath)

        ws = wb.create_sheet(title=f"Bitácora {num:02d}")
        ws.column_dimensions["A"].width = 22
        ws.column_dimensions["B"].width = 95

        row = 1

        # Title
        ws.merge_cells(f"A{row}:B{row}")
        cell = ws[f"A{row}"]
        cell.value = sections["title"].upper()
        cell.font = title_font
        cell.alignment = Alignment(horizontal="center")
        row += 2

        # Info table
        for label, value in sections["info"]:
            ws[f"A{row}"].value = label
            ws[f"A{row}"].font = info_label_font
            ws[f"A{row}"].border = thin_border
            ws[f"A{row}"].alignment = wrap
            ws[f"B{row}"].value = value
            ws[f"B{row}"].font = normal_font
            ws[f"B{row}"].border = thin_border
            ws[f"B{row}"].alignment = wrap
            row += 1

        row += 1

        # Standard sections
        all_sections = standard_sections[:]
        # Add extra sections for bitácora 10
        if num == 10:
            all_sections += extra_sections

        for md_heading, excel_title in all_sections:
            body = sections.get(md_heading, "")
            if not body:
                continue

            # Section header
            ws.merge_cells(f"A{row}:B{row}")
            cell = ws[f"A{row}"]
            cell.value = excel_title
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = center
            ws[f"B{row}"].fill = header_fill
            ws[f"B{row}"].border = thin_border
            row += 1

            # Special handling for "Resumen del Estado del Proyecto" - has a table
            if md_heading == "Resumen del Estado del Proyecto":
                # Parse the intro text and the table
                intro_lines = []
                table_rows = []
                for line in body.split("\n"):
                    table_match = re.match(r"\| \*\*(.+?)\*\* \| (.+?) \|", line)
                    if table_match:
                        table_rows.append((table_match.group(1), table_match.group(2)))
                    elif line.strip() and not line.strip().startswith("|"):
                        intro_lines.append(line.strip())

                # Write intro
                if intro_lines:
                    for il in intro_lines:
                        ws.merge_cells(f"A{row}:B{row}")
                        ws[f"A{row}"].value = il
                        ws[f"A{row}"].font = normal_font
                        ws[f"A{row}"].alignment = wrap
                        ws[f"A{row}"].border = thin_border
                        ws[f"B{row}"].border = thin_border
                        row += 1

                # Write table
                if table_rows:
                    # Table header
                    ws[f"A{row}"].value = "Métrica"
                    ws[f"A{row}"].font = info_label_font
                    ws[f"A{row}"].border = thin_border
                    ws[f"B{row}"].value = "Valor"
                    ws[f"B{row}"].font = info_label_font
                    ws[f"B{row}"].border = thin_border
                    row += 1
                    for metrica, valor in table_rows:
                        ws[f"A{row}"].value = metrica
                        ws[f"A{row}"].font = normal_font
                        ws[f"A{row}"].border = thin_border
                        ws[f"A{row}"].alignment = wrap
                        ws[f"B{row}"].value = valor
                        ws[f"B{row}"].font = normal_font
                        ws[f"B{row}"].border = thin_border
                        ws[f"B{row}"].alignment = wrap
                        row += 1
            else:
                # Normal section: parse into lines and write
                lines = body_to_lines(body)
                for line_text in lines:
                    ws.merge_cells(f"A{row}:B{row}")
                    cell = ws[f"A{row}"]
                    display = line_text.replace("**", "")
                    cell.value = display
                    cell.font = normal_font
                    cell.alignment = wrap
                    cell.border = thin_border
                    ws[f"B{row}"].border = thin_border
                    line_count = display.count("\n") + 1
                    max_line_len = max(len(l) for l in display.split("\n"))
                    ws.row_dimensions[row].height = max(20, line_count * 16, (max_line_len // 90 + 1) * 16)
                    row += 1

            row += 1  # Blank row between sections

    # Remove default sheet
    del wb["Sheet"]

    output_path = os.path.join(BITACORAS_DIR, "Bitacoras_Trabajo_de_Grado.xlsx")
    wb.save(output_path)
    print(f"Excel guardado en: {output_path}")


if __name__ == "__main__":
    create_excel()
