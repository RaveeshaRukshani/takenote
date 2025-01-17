import React, { useContext } from 'react'
import { ArrowUp, Download, Star, Trash, X, Edit2, Clipboard } from 'react-feather'
import { useDispatch, useSelector } from 'react-redux'

import { LabelText } from '@resources/LabelText'
import { TestID } from '@resources/TestID'
import { ContextMenuOption } from '@/components/NoteList/ContextMenuOption'
import { downloadNotes, isDraftNote, getShortUuid, copyToClipboard } from '@/utils/helpers'
import {
  deleteNotes,
  toggleFavoriteNotes,
  toggleTrashNotes,
  addCategoryToNote,
  updateActiveNote,
  swapFolder,
} from '@/slices/note'
import { getCategories, getNotes, getSettings } from '@/selectors'
import { Folder, ContextMenuEnum } from '@/utils/enums'
import { CategoryItem, NoteItem } from '@/types'
import { setCategoryEdit, deleteCategory } from '@/slices/category'
import { MenuUtilitiesContext } from '@/containers/ContextMenu'
import { showConfirmationAlert } from '@/containers/ConfirmDialog'
import UIfx from 'uifx';

// ===========================================================================
// Sound Efect
// ===========================================================================

  const renameSound = require("../../../sounds/Rename.mp3");
  const renameClick = new UIfx(renameSound, {volume: 0.4});

  const alertSound = require("../../../sounds/Alert.mp3");
  const alertClick = new UIfx(alertSound, {volume: 0.4});

  const favouriteSound = require("../../../sounds/Favourite.wav");
  const favouriteClick = new UIfx(favouriteSound, {volume: 0.4});

  const downloadSound = require("../../../sounds/Download.mp3");
  const downloadClick = new UIfx(downloadSound, {volume: 0.4});

  const copySound = require("../../../sounds/Copy.mp3");
  const copyClick = new UIfx(copySound, {volume: 0.4});

  const clickSound = require("../../../sounds/Click.mp3");
  const click = new UIfx(clickSound, {volume: 0.4});

export interface ContextMenuOptionsProps {
  clickedItem: NoteItem | CategoryItem
  type: ContextMenuEnum
}

export const ContextMenuOptions: React.FC<ContextMenuOptionsProps> = ({ clickedItem, type }) => {
  if (type === 'CATEGORY') {
    return <CategoryOptions clickedCategory={clickedItem as CategoryItem} />
  } else {
    return <NotesOptions clickedNote={clickedItem as NoteItem} />
  }
}

interface CategoryOptionsProps {
  clickedCategory: CategoryItem
}

const CategoryOptions: React.FC<CategoryOptionsProps> = ({ clickedCategory }) => {
  // ===========================================================================
  // Selectors
  // ===========================================================================

  const { darkTheme } = useSelector(getSettings)

  // ===========================================================================
  // Dispatch
  // ===========================================================================

  const dispatch = useDispatch()

  const _deleteCategory = (categoryId: string) => dispatch(deleteCategory(categoryId))
  const _swapFolder = (folder: Folder) => dispatch(swapFolder({ folder }))
  const _setCategoryEdit = (categoryId: string, tempName: string) =>
    dispatch(setCategoryEdit({ id: categoryId, tempName }))

  // ===========================================================================
  // Context
  // ===========================================================================

  const { setOptionsId } = useContext(MenuUtilitiesContext)

  // ===========================================================================
  // Handlers
  // ===========================================================================

  const startRenameHandler = () => {
    renameClick.play()
    _setCategoryEdit(clickedCategory.id, clickedCategory.name)
    setOptionsId('')
  }
  const removeCategoryHandler = () => {
    alertClick.play()
    showConfirmationAlert(
      LabelText.CATEGORY_DELETE_ALERT_CONTENT,
      () => {
        _deleteCategory(clickedCategory.id)
        _swapFolder(Folder.ALL)
      },
      darkTheme
    )
  }

  return (
    <nav className="options-nav" data-testid={TestID.CATEGORY_OPTIONS_NAV}>
      <ContextMenuOption
        dataTestID={TestID.CATEGORY_OPTION_RENAME}
        handler={startRenameHandler}
        icon={Edit2}
        text={LabelText.RENAME}
      />
      <ContextMenuOption
        dataTestID={TestID.CATEGORY_OPTION_DELETE_PERMANENTLY}
        handler={removeCategoryHandler}
        icon={X}
        text={LabelText.DELETE_PERMANENTLY}
        optionType="delete"
      />
    </nav>
  )
}

interface NotesOptionsProps {
  clickedNote: NoteItem
}

const NotesOptions: React.FC<NotesOptionsProps> = ({ clickedNote }) => {
  // ===========================================================================
  // Selectors
  // ===========================================================================

  const { selectedNotesIds, notes } = useSelector(getNotes)
  const { categories } = useSelector(getCategories)
  const { darkTheme } = useSelector(getSettings)

  const selectedNotes = notes.filter((note) => selectedNotesIds.includes(note.id))
  const isSelectedNotesDiffFavor = Boolean(
    selectedNotes.find((note) => note.favorite) && selectedNotes.find((note) => !note.favorite)
  )

  // ===========================================================================
  // Dispatch
  // ===========================================================================

  const dispatch = useDispatch()

  const _deleteNotes = (noteIds: string[]) => dispatch(deleteNotes(noteIds))
  const _toggleTrashNotes = (noteId: string) => dispatch(toggleTrashNotes(noteId))
  const _toggleFavoriteNotes = (noteId: string) => dispatch(toggleFavoriteNotes(noteId))
  const _addCategoryToNote = (categoryId: string, noteId: string) =>
    dispatch(addCategoryToNote({ categoryId, noteId }))
  const _updateActiveNote = (noteId: string, multiSelect: boolean) =>
    dispatch(updateActiveNote({ noteId, multiSelect }))

  // ===========================================================================
  // Handlers
  // ===========================================================================

  const deleteNotesHandler = () => {
    alertClick.play()
    showConfirmationAlert(
      LabelText.NOTE_DELETE_ALERT_CONTENT,
      () => {
        _deleteNotes(selectedNotesIds)
      },
      darkTheme
    )
  }
  const downloadNotesHandler = () => {
    downloadClick.play()
    downloadNotes(
      selectedNotesIds.includes(clickedNote.id) ? selectedNotes : [clickedNote],
      categories
    )
  } 
  const favoriteNoteHandler = () => {
    favouriteClick.play()
    _toggleFavoriteNotes(clickedNote.id)
  }
  const trashNoteHandler = () => {
    if (clickedNote.trash) {
      _toggleTrashNotes(clickedNote.id)
    } else {
      alertClick.play()
      showConfirmationAlert(
        LabelText.NOTE_TO_TRASH_ALERT_CONTENT,
        () => _toggleTrashNotes(clickedNote.id),
        darkTheme
      )
    }
  }
  const removeCategoryFromNoteHandler = () => {
    click.play()
    _addCategoryToNote('', clickedNote.id)
    _updateActiveNote(clickedNote.id, false)
  }
  const copyLinkedNoteMarkdownHandler = (e: React.SyntheticEvent, note: NoteItem) => {
    e.preventDefault()

    copyClick.play()
    const shortNoteUuid = getShortUuid(note.id)
    copyToClipboard(`{{${shortNoteUuid}}}`)
  }

  return !isDraftNote(clickedNote) ? (
    <nav className="options-nav" data-testid={TestID.NOTE_OPTIONS_NAV}>
      {clickedNote.trash && (
        <>
          <ContextMenuOption
            dataTestID={TestID.NOTE_OPTION_DELETE_PERMANENTLY}
            handler={deleteNotesHandler}
            icon={X}
            text={LabelText.DELETE_PERMANENTLY}
            optionType="delete"
          />
          <ContextMenuOption
            dataTestID={TestID.NOTE_OPTION_RESTORE_FROM_TRASH}
            handler={trashNoteHandler}
            icon={ArrowUp}
            text={LabelText.RESTORE_FROM_TRASH}
          />
        </>
      )}
      {!clickedNote.scratchpad && !clickedNote.trash && (
        <>
          <ContextMenuOption
            dataTestID={TestID.NOTE_OPTION_FAVORITE}
            handler={favoriteNoteHandler}
            icon={Star}
            text={
              isSelectedNotesDiffFavor
                ? LabelText.TOGGLE_FAVORITE
                : clickedNote.favorite
                ? LabelText.REMOVE_FAVORITE
                : LabelText.MARK_AS_FAVORITE
            }
          />
          <ContextMenuOption
            dataTestID={TestID.NOTE_OPTION_TRASH}
            handler={trashNoteHandler}
            icon={Trash}
            text={LabelText.MOVE_TO_TRASH}
            optionType="delete"
          />
        </>
      )}
      {clickedNote.category && !clickedNote.trash && (
        <ContextMenuOption
          dataTestID={TestID.NOTE_OPTION_REMOVE_CATEGORY}
          handler={removeCategoryFromNoteHandler}
          icon={X}
          text={LabelText.REMOVE_CATEGORY}
        />
      )}
      <ContextMenuOption
        dataTestID={TestID.NOTE_OPTION_DOWNLOAD}
        handler={downloadNotesHandler}
        icon={Download}
        text={LabelText.DOWNLOAD}
      />
      <ContextMenuOption
        dataTestID={TestID.COPY_REFERENCE_TO_NOTE}
        handler={(e: React.SyntheticEvent) => copyLinkedNoteMarkdownHandler(e, clickedNote)}
        icon={Clipboard}
        text={LabelText.COPY_REFERENCE_TO_NOTE}
      />
    </nav>
  ) : null
}
