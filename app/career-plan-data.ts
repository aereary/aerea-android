export type CareerCourseStatus = "APROBADO" | "CURSANDO" | "PENDIENTE";
export type ProfessorRating = "recommended" | "maybe" | "avoid";

export type CareerCourse = {
  quarter: number;
  code: string;
  name: string;
  credits: number;
  theory: number;
  practice: number;
  lab: number;
  hours: number;
  prereq: string | null;
  status: CareerCourseStatus;
  available: boolean;
};

export type CareerProfessor = {
  id: string;
  name: string;
  rating: ProfessorRating;
};

export const CAREER_COURSES: readonly CareerCourse[] = [
  { quarter: 1, code: "EDU-005A", name: "Inglés I", credits: 3, theory: 2, practice: 2, lab: 0, hours: 4, prereq: null, status: "APROBADO", available: true },
  { quarter: 1, code: "IMP-02", name: "Introducción a la Ingeniería Mecatrónica", credits: 3, theory: 2, practice: 2, lab: 0, hours: 4, prereq: null, status: "APROBADO", available: true },
  { quarter: 1, code: "FIS-006", name: "Cálculo Diferencial", credits: 4, theory: 3, practice: 2, lab: 0, hours: 5, prereq: null, status: "CURSANDO", available: true },
  { quarter: 1, code: "IIE-017", name: "Metrología y Normalización", credits: 3, theory: 2, practice: 2, lab: 0, hours: 4, prereq: null, status: "APROBADO", available: true },
  { quarter: 1, code: "LSEB-018", name: "Métodos y Técnicas de Investigación", credits: 3, theory: 2, practice: 2, lab: 0, hours: 4, prereq: null, status: "APROBADO", available: true },
  { quarter: 1, code: "IMP-09A", name: "Español", credits: 3, theory: 3, practice: 0, lab: 0, hours: 3, prereq: null, status: "APROBADO", available: true },
  { quarter: 2, code: "EDU-010A", name: "Inglés II", credits: 3, theory: 2, practice: 2, lab: 0, hours: 4, prereq: "EDU-005A", status: "APROBADO", available: true },
  { quarter: 2, code: "FIS-005", name: "Programación I", credits: 4, theory: 3, practice: 2, lab: 0, hours: 5, prereq: null, status: "APROBADO", available: true },
  { quarter: 2, code: "FIS-010", name: "Cálculo Integral", credits: 4, theory: 3, practice: 2, lab: 0, hours: 5, prereq: "FIS-006", status: "PENDIENTE", available: false },
  { quarter: 2, code: "IIE-004", name: "Física Aplicada I", credits: 4, theory: 3, practice: 0, lab: 3, hours: 6, prereq: null, status: "APROBADO", available: true },
  { quarter: 2, code: "IIE-005", name: "Química Aplicada", credits: 4, theory: 3, practice: 0, lab: 3, hours: 6, prereq: null, status: "APROBADO", available: true },
  { quarter: 2, code: "IMP-25", name: "Dibujo Técnico Asistido por Computadoras", credits: 3, theory: 2, practice: 2, lab: 0, hours: 4, prereq: null, status: "APROBADO", available: true },
  { quarter: 3, code: "EDU-011A", name: "Inglés III", credits: 3, theory: 2, practice: 2, lab: 0, hours: 4, prereq: "EDU-010A", status: "APROBADO", available: true },
  { quarter: 3, code: "FIS-007", name: "Álgebra de Vectores y Matrices", credits: 4, theory: 3, practice: 2, lab: 0, hours: 5, prereq: "FIS-010", status: "PENDIENTE", available: false },
  { quarter: 3, code: "FIS-008", name: "Programación II", credits: 4, theory: 2, practice: 2, lab: 0, hours: 4, prereq: "FIS-005", status: "APROBADO", available: true },
  { quarter: 3, code: "IIE-007", name: "Física Aplicada II", credits: 4, theory: 3, practice: 0, lab: 3, hours: 6, prereq: "IIE-004", status: "PENDIENTE", available: true },
  { quarter: 3, code: "IIE-008", name: "Circuitos Eléctricos I", credits: 4, theory: 3, practice: 0, lab: 3, hours: 6, prereq: "IIE-004", status: "PENDIENTE", available: true },
  { quarter: 3, code: "IMP-27", name: "Historia de Panamá", credits: 3, theory: 3, practice: 0, lab: 0, hours: 3, prereq: null, status: "APROBADO", available: true },
  { quarter: 4, code: "EDU-055A", name: "Inglés IV", credits: 3, theory: 2, practice: 2, lab: 0, hours: 4, prereq: "EDU-011A", status: "APROBADO", available: true },
  { quarter: 4, code: "FIS-019", name: "Ecuaciones Diferenciales", credits: 4, theory: 3, practice: 2, lab: 0, hours: 5, prereq: "FIS-010", status: "PENDIENTE", available: false },
  { quarter: 4, code: "IMP-11", name: "Electrónica I", credits: 4, theory: 3, practice: 0, lab: 3, hours: 6, prereq: "IIE-008", status: "PENDIENTE", available: false },
  { quarter: 4, code: "IMP-12", name: "Programación III", credits: 4, theory: 3, practice: 2, lab: 0, hours: 5, prereq: "FIS-008", status: "APROBADO", available: true },
  { quarter: 4, code: "IMP-10", name: "Circuitos Eléctricos II", credits: 4, theory: 3, practice: 0, lab: 3, hours: 6, prereq: "IIE-008", status: "PENDIENTE", available: false },
  { quarter: 4, code: "EDU-090", name: "Geografía de Panamá", credits: 3, theory: 3, practice: 0, lab: 0, hours: 3, prereq: null, status: "APROBADO", available: true },
  { quarter: 5, code: "IMP-21", name: "Matemáticas Superiores en Ingenierías", credits: 4, theory: 3, practice: 2, lab: 0, hours: 5, prereq: "FIS-019", status: "PENDIENTE", available: false },
  { quarter: 5, code: "IMP-68", name: "Estática", credits: 4, theory: 3, practice: 0, lab: 3, hours: 6, prereq: "IIE-007", status: "PENDIENTE", available: false },
  { quarter: 5, code: "IMP-29", name: "Electrónica II", credits: 4, theory: 3, practice: 0, lab: 3, hours: 6, prereq: "IMP-11", status: "PENDIENTE", available: false },
  { quarter: 5, code: "IMP-69", name: "Ingeniería de los Materiales y sus Aplicaciones", credits: 4, theory: 2, practice: 2, lab: 0, hours: 4, prereq: null, status: "APROBADO", available: true },
  { quarter: 5, code: "IMP-32", name: "Circuitos Eléctricos III", credits: 4, theory: 3, practice: 0, lab: 3, hours: 6, prereq: "IMP-10", status: "PENDIENTE", available: false },
  { quarter: 5, code: "IIE-024B", name: "Educación Ambiental", credits: 3, theory: 2, practice: 2, lab: 0, hours: 4, prereq: null, status: "APROBADO", available: true },
  { quarter: 6, code: "IMP-26", name: "Dinámica", credits: 4, theory: 3, practice: 2, lab: 0, hours: 5, prereq: "IMP-68", status: "PENDIENTE", available: false },
  { quarter: 6, code: "IMP-34", name: "Mecánica de Fluidos", credits: 4, theory: 3, practice: 0, lab: 3, hours: 6, prereq: "IMP-21", status: "PENDIENTE", available: false },
  { quarter: 6, code: "IMP-33", name: "Diseño Técnico Asistido por Computadora 3", credits: 4, theory: 3, practice: 2, lab: 0, hours: 5, prereq: "IMP-69", status: "PENDIENTE", available: true },
  { quarter: 6, code: "IMP-20", name: "Electrónica Digital Combinacional", credits: 4, theory: 3, practice: 0, lab: 3, hours: 6, prereq: "IMP-11", status: "PENDIENTE", available: false },
  { quarter: 6, code: "IMP-35", name: "Probabilidad y Estadística", credits: 4, theory: 2, practice: 2, lab: 0, hours: 4, prereq: null, status: "APROBADO", available: true },
  { quarter: 6, code: "IMP-30", name: "Electrónica III", credits: 4, theory: 3, practice: 0, lab: 3, hours: 6, prereq: "IMP-29", status: "PENDIENTE", available: false },
  { quarter: 7, code: "IMP-70", name: "Fundamento de Redes", credits: 4, theory: 3, practice: 2, lab: 0, hours: 5, prereq: null, status: "APROBADO", available: true },
  { quarter: 7, code: "IMP-71", name: "Higiene y Seguridad Industrial", credits: 4, theory: 3, practice: 2, lab: 0, hours: 5, prereq: null, status: "APROBADO", available: true },
  { quarter: 7, code: "IMP-72", name: "Neumática y Óleo Hidráulica", credits: 4, theory: 3, practice: 0, lab: 3, hours: 6, prereq: "IMP-33", status: "PENDIENTE", available: false },
  { quarter: 7, code: "IMP-22", name: "Electrónica Digital Secuencial", credits: 4, theory: 3, practice: 0, lab: 3, hours: 6, prereq: "IMP-20", status: "PENDIENTE", available: false },
  { quarter: 7, code: "IMP-73", name: "Tecnología de los Materiales y de las Máquinas I", credits: 4, theory: 3, practice: 2, lab: 0, hours: 5, prereq: "IMP-68", status: "PENDIENTE", available: false },
  { quarter: 7, code: "IMP-74", name: "Teoría de Sistemas Mecatrónicos I", credits: 4, theory: 3, practice: 0, lab: 3, hours: 6, prereq: "IMP-21", status: "PENDIENTE", available: false },
  { quarter: 8, code: "IC-018", name: "Circuitos y Sistemas Electrónicos IV", credits: 4, theory: 3, practice: 0, lab: 3, hours: 6, prereq: "IMP-22", status: "PENDIENTE", available: false },
  { quarter: 8, code: "IMP-31", name: "Configuración de Ruteadores", credits: 4, theory: 3, practice: 2, lab: 0, hours: 5, prereq: "IMP-70", status: "APROBADO", available: true },
  { quarter: 8, code: "IMP-37", name: "Óleo Hidráulica Proporcional", credits: 4, theory: 3, practice: 0, lab: 3, hours: 6, prereq: "IMP-72", status: "PENDIENTE", available: false },
  { quarter: 8, code: "IMP-38", name: "Comando Numérico Computarizado I", credits: 4, theory: 3, practice: 0, lab: 3, hours: 6, prereq: "IIE-017", status: "PENDIENTE", available: true },
  { quarter: 8, code: "IMP-39", name: "Tecnología de los Materiales II", credits: 4, theory: 3, practice: 2, lab: 0, hours: 5, prereq: "IMP-73", status: "PENDIENTE", available: false },
  { quarter: 8, code: "IMP-45", name: "Teoría de Sistemas Mecatrónicos II", credits: 4, theory: 3, practice: 0, lab: 3, hours: 6, prereq: "IMP-74", status: "PENDIENTE", available: false },
  { quarter: 9, code: "IMP-36", name: "Conmutación en Redes de Datos y VLAN", credits: 4, theory: 3, practice: 2, lab: 0, hours: 5, prereq: "IMP-31", status: "CURSANDO", available: true },
  { quarter: 9, code: "IMP-42", name: "Inteligencia Artificial", credits: 4, theory: 3, practice: 2, lab: 0, hours: 5, prereq: "IMP-12", status: "CURSANDO", available: true },
  { quarter: 9, code: "IMP-43", name: "Comando Numérico Computarizado II", credits: 4, theory: 3, practice: 0, lab: 3, hours: 6, prereq: "IMP-38", status: "PENDIENTE", available: false },
  { quarter: 9, code: "IMP-44", name: "Mecanismos", credits: 3, theory: 2, practice: 2, lab: 0, hours: 4, prereq: "IMP-26", status: "PENDIENTE", available: false },
  { quarter: 9, code: "IMP-67", name: "Tecnología Mecánica", credits: 3, theory: 2, practice: 0, lab: 3, hours: 5, prereq: "IMP-25", status: "CURSANDO", available: true },
  { quarter: 9, code: "IMP-75", name: "Termodinámica", credits: 3, theory: 2, practice: 2, lab: 0, hours: 4, prereq: "IMP-69", status: "CURSANDO", available: true },
  { quarter: 10, code: "IMP-46A", name: "Programadores Lógicos Controlados", credits: 4, theory: 3, practice: 0, lab: 3, hours: 6, prereq: "IC-018", status: "PENDIENTE", available: false },
  { quarter: 10, code: "IMP-47", name: "Introducción a la Robótica", credits: 4, theory: 3, practice: 0, lab: 3, hours: 6, prereq: "IMP-42", status: "PENDIENTE", available: false },
  { quarter: 10, code: "IMP-50", name: "Administración de la Producción", credits: 3, theory: 2, practice: 2, lab: 0, hours: 4, prereq: null, status: "APROBADO", available: true },
  { quarter: 10, code: "IMP-49", name: "Sensores Industriales I", credits: 4, theory: 3, practice: 0, lab: 3, hours: 6, prereq: "IMP-32", status: "PENDIENTE", available: false },
  { quarter: 10, code: "IMP-52", name: "Administración de Redes de Datos", credits: 4, theory: 3, practice: 2, lab: 0, hours: 5, prereq: "IMP-36", status: "APROBADO", available: true },
  { quarter: 10, code: "IMP-76", name: "Máquinas Eléctricas", credits: 4, theory: 3, practice: 0, lab: 3, hours: 6, prereq: "IMP-32", status: "PENDIENTE", available: false },
  { quarter: 11, code: "IMP-51", name: "Sensores Industriales II", credits: 4, theory: 3, practice: 0, lab: 3, hours: 6, prereq: "IMP-49", status: "PENDIENTE", available: false },
  { quarter: 11, code: "IMP-55", name: "Formulación y Evaluación de Proyectos", credits: 3, theory: 2, practice: 2, lab: 0, hours: 4, prereq: "IMP-50", status: "APROBADO", available: true },
  { quarter: 11, code: "IMP-77", name: "Procesos de Manufactura", credits: 4, theory: 3, practice: 0, lab: 3, hours: 6, prereq: "IMP-43", status: "PENDIENTE", available: false },
  { quarter: 11, code: "IIE-027", name: "Autogestión Empresarial", credits: 3, theory: 2, practice: 2, lab: 0, hours: 4, prereq: null, status: "PENDIENTE", available: true },
  { quarter: 11, code: "IMP-78", name: "Manejo Integral de la Calidad", credits: 3, theory: 2, practice: 2, lab: 0, hours: 4, prereq: "IMP-50", status: "APROBADO", available: true },
  { quarter: 11, code: "IMP-79", name: "Sistemas Flexibles de Manufactura", credits: 4, theory: 3, practice: 0, lab: 3, hours: 6, prereq: "IMP-76", status: "PENDIENTE", available: false },
  { quarter: 12, code: "IMP-56", name: "Ética Profesional", credits: 3, theory: 3, practice: 0, lab: 0, hours: 3, prereq: null, status: "APROBADO", available: true },
  { quarter: 12, code: "IMP-57", name: "Legislación Laboral", credits: 3, theory: 2, practice: 2, lab: 0, hours: 4, prereq: null, status: "CURSANDO", available: true },
  { quarter: 12, code: "IMP-80", name: "Diseño Mecatrónico", credits: 4, theory: 2, practice: 0, lab: 3, hours: 5, prereq: "IMP-46A", status: "PENDIENTE", available: false },
  { quarter: 12, code: "IMP-039", name: "Práctica Profesional", credits: 8, theory: 3, practice: 10, lab: 0, hours: 13, prereq: null, status: "PENDIENTE", available: true },
  { quarter: 12, code: "PAD-009", name: "Sistemas de Información Gerencial", credits: 4, theory: 3, practice: 10, lab: 0, hours: 13, prereq: null, status: "PENDIENTE", available: true },
  { quarter: 12, code: "MAN-026", name: "Habilidades Gerenciales", credits: 4, theory: 3, practice: 10, lab: 0, hours: 13, prereq: null, status: "PENDIENTE", available: true },
];

export const CAREER_PROFESSORS: readonly CareerProfessor[] = [
  { id: "baseline-01", name: "Alejandra Hidalgo", rating: "recommended" },
  { id: "baseline-02", name: "Alena Baliga", rating: "avoid" },
  { id: "baseline-03", name: "Edgar A Charris", rating: "maybe" },
  { id: "baseline-04", name: "Ambrosino Salvatore", rating: "recommended" },
  { id: "baseline-05", name: "Amílcar Maximino Martínez Lezcano", rating: "recommended" },
  { id: "baseline-06", name: "Dorimar Delpino", rating: "recommended" },
  { id: "baseline-07", name: "Enelda Chong S.", rating: "recommended" },
  { id: "baseline-08", name: "Freddy Quiroz", rating: "recommended" },
  { id: "baseline-09", name: "IGORY KEVIR TOVAR MÉNDEZ.", rating: "recommended" },
  { id: "baseline-10", name: "Jorge Eslin Cumbrera", rating: "recommended" },
  { id: "baseline-11", name: "JOSÉ JAÉN WILLIAMSON", rating: "recommended" },
  { id: "baseline-12", name: "Katerine Díaz", rating: "recommended" },
  { id: "baseline-13", name: "LEONEL. GONZALEZ.", rating: "recommended" },
  { id: "baseline-14", name: "Manuel Navarro Romero", rating: "recommended" },
  { id: "baseline-15", name: "MEH MIEDO Edgar Antonio Charris García", rating: "recommended" },
  { id: "baseline-16", name: "Miguel Angel Villarreal González", rating: "recommended" },
  { id: "baseline-17", name: "Oriel A. Cedeño", rating: "recommended" },
  { id: "baseline-18", name: "ROLANDO A. COLINS", rating: "recommended" },
  { id: "baseline-19", name: "SALVATORE AMBROSINO ADAMES", rating: "recommended" },
];
