from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"


def trim_and_fit(name: str, size: tuple[int, int], pad_ratio: float = 0.06) -> None:
    path = ASSETS / name
    image = Image.open(path).convert("RGBA")
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    if not bbox:
        raise RuntimeError(f"{name} has no visible pixels")
    image = image.crop(bbox)
    pad = max(4, round(max(image.size) * pad_ratio))
    padded = Image.new("RGBA", (image.width + pad * 2, image.height + pad * 2))
    padded.alpha_composite(image, (pad, pad))
    padded.thumbnail(size, Image.Resampling.LANCZOS)
    output = Image.new("RGBA", size)
    output.alpha_composite(
        padded,
        ((size[0] - padded.width) // 2, (size[1] - padded.height) // 2),
    )
    output.save(path, optimize=True)


def fit_cover(name: str, size: tuple[int, int]) -> None:
    path = ASSETS / name
    image = Image.open(path).convert("RGB")
    source_ratio = image.width / image.height
    target_ratio = size[0] / size[1]
    if source_ratio > target_ratio:
        width = round(image.height * target_ratio)
        left = (image.width - width) // 2
        image = image.crop((left, 0, left + width, image.height))
    else:
        height = round(image.width / target_ratio)
        top = (image.height - height) // 2
        image = image.crop((0, top, image.width, top + height))
    image.resize(size, Image.Resampling.LANCZOS).save(path, optimize=True)


def resize_square(name: str, edge: int) -> None:
    path = ASSETS / name
    Image.open(path).convert("RGB").resize(
        (edge, edge), Image.Resampling.LANCZOS
    ).save(path, optimize=True)


trim_and_fit("ball_hero.png", (384, 384))
trim_and_fit("spike_hazard.png", (512, 256), 0.03)
trim_and_fit("spring_pad.png", (384, 384))
trim_and_fit("goal_portal.png", (384, 384))
trim_and_fit("star_pickup.png", (256, 256), 0.03)
trim_and_fit("favicon.png", (256, 256), 0.03)
resize_square("platform_tile.png", 512)
fit_cover("sky_backdrop.png", (1600, 900))
fit_cover("store_thumbnail.png", (1600, 900))
