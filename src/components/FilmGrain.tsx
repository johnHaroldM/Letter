/** A faint, flickering layer of film grain over the whole viewport. Pure CSS. */
export function FilmGrain() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <div className="film-grain" />
    </div>
  )
}
