from src.config import get_settings


def main() -> None:
    settings = get_settings()
    print(
        "SEO Market Research Automation started "
        f"(database={settings.database_type}, "
        f"llm_model={settings.llm_model or 'not set'}, "
        f"serp_provider={settings.serp_provider or 'not set'})"
    )


if __name__ == "__main__":
    main()
