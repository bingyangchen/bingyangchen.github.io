export function openResumePrintDialog(): void {
  const runPrint = (): void => {
    window.print();
  };

  if (document.fonts && document.fonts.ready) {
    void document.fonts.ready.then(runPrint);
    return;
  }

  runPrint();
}
