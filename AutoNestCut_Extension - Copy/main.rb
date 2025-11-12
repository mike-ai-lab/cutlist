module AutoNestCut
  unless defined?(@loaded)
    @loaded = true

    UI.menu("Plugins").add_item("AutoNestCut Test") {
      UI.messagebox("AutoNestCut loaded without encryption.")
    }
  end
end
