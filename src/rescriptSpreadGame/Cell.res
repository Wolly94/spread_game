@genType
type cell = {
    id: int,
    ownerId: option<int>,
    units: float,
    radius: float,
    position: Vector2D.vector
}