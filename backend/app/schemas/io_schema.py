from enum import Enum
from typing import Dict, List
from pydantic import BaseModel


class IOSchemaSupportedTypes(Enum):
    int = int
    float = float
    str = str
    bool = bool
    List_int = List[int]
    List_float = List[float]
    List_str = List[str]
    List_bool = List[bool]
    Dict_str_int = Dict[str, int]
    Dict_str_str = Dict[str, str]
    Dict_str_float = Dict[str, float]
    Dict_str_bool = Dict[str, bool]
    List_Dict_str_float = List[Dict[str, float]]
    List_Dict_str_int = List[Dict[str, int]]
    List_Dict_str_str = List[Dict[str, str]]
    List_Dict_str_bool = List[Dict[str, bool]]


class IOSchema(BaseModel):
    class Config:
        extra = "allow"

    def __setattr__(self, key: str, value: IOSchemaSupportedTypes):
        super().__setattr__(key, value)


if __name__ == "__main__":
    schema = IOSchema(
        user_message=IOSchemaSupportedTypes.str,
        user_age=IOSchemaSupportedTypes.int,
        user_is_student=IOSchemaSupportedTypes.bool,
        user_gpa=IOSchemaSupportedTypes.float,
        user_courses=IOSchemaSupportedTypes.List_str,
        user_grades=IOSchemaSupportedTypes.List_Dict_str_float,
    )
    print(schema.model_dump())
