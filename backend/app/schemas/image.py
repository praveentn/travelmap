from datetime import datetime

from pydantic import BaseModel


class ImageOut(BaseModel):
    id: str
    place_id: str
    file_path: str
    uploaded_at: datetime

    model_config = {"from_attributes": True}
