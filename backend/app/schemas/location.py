from pydantic import BaseModel


class LocationBase(BaseModel):
    """Base location schema with shared fields."""

    country: str
    state: str | None = None
    city: str
    airport_code: str | None = None


class LocationCreate(LocationBase):
    """Schema for creating a new location."""

    pass


class LocationUpdate(BaseModel):
    """Schema for updating location information."""

    country: str | None = None
    state: str | None = None
    city: str | None = None
    airport_code: str | None = None


class LocationInDB(LocationBase):
    """Location schema as stored in database."""

    id: int

    model_config = {"from_attributes": True}


class Location(LocationInDB):
    """Location schema for API responses."""

    pass
