"""Player avatar options (stored in user.preferences["avatar"])."""

AVATAR_OPTIONS = {
    "skin": ["porcelain", "peach", "tan", "olive", "brown", "deep"],
    "hair": ["short", "long", "spiky", "ponytail", "bald"],
    "hair_color": ["black", "brown", "blonde", "red", "silver", "blue", "pink"],
    "face": ["smile", "determined", "sleepy", "surprised", "glasses"],
    "color": ["saffron", "indigo", "sage", "coral", "plum", "teal", "amber", "slate"],
    "hat": ["none", "straw", "beanie", "flowers", "bandana", "cap"],
}

DEFAULT_AVATAR = {
    "skin": "peach",
    "hair": "short",
    "hair_color": "brown",
    "face": "smile",
    "color": "indigo",
    "hat": "none",
}


def clean_avatar(value: object) -> dict:
    """Return a complete, valid avatar, filling in defaults for anything missing or unknown."""
    avatar = value if isinstance(value, dict) else {}
    return {
        key: avatar.get(key) if avatar.get(key) in options else DEFAULT_AVATAR[key]
        for key, options in AVATAR_OPTIONS.items()
    }


def avatar_of(user) -> dict:
    return clean_avatar((user.preferences or {}).get("avatar"))
